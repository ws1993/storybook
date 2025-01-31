import { isEqual } from 'es-toolkit';
import { dedent } from 'ts-dedent';

import { instances } from './instances';
import type {
  Actor,
  ChannelEvent,
  ChannelLike,
  EnvironmentType,
  Event,
  EventInfo,
  ExistingStateResponseEvent,
  Listener,
  SetStateEvent,
  StateUpdater,
  StoreOptions,
} from './types';

const CHANNEL_EVENT_PREFIX = 'UNIVERSAL_STORE:' as const;

const ProgressState = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;

/**
 * A universal store implementation that synchronizes state across different environments using a
 * channel-based communication.
 *
 * The store follows a leader-follower pattern where:
 *
 * - Leader: The main store instance that owns and manages the state
 * - Follower: Store instances that mirror the leader's state
 *
 * Features:
 *
 * - State synchronization across environments
 * - Event-based communication
 * - Type-safe state and custom events
 * - Subscription system for state changes and custom events
 *
 * @remarks
 * - The store must be created using the static `create()` method, not the constructor
 * - Only leader stores can set initial state
 * - Follower stores will automatically sync with their leader's state
 *
 * @example
 *
 * ```typescript
 * interface MyState {
 *   count: number;
 * }
 * interface MyCustomEvent {
 *   type: 'INCREMENT';
 *   payload: number;
 * }
 *
 * // Create a leader store
 * const leaderStore = UniversalStore.create<MyState, MyCustomEvent>({
 *   id: 'my-store',
 *   leader: true,
 *   initialState: { count: 0 },
 * });
 *
 * // Create a follower store
 * const followerStore = UniversalStore.create<MyState, MyCustomEvent>({
 *   id: 'my-store',
 *   leader: false,
 * });
 * ```
 *
 * @template State - The type of state managed by the store
 * @template CustomEvent - Custom events that can be sent through the store. Must have a `type`
 *   string and optional `payload`
 * @throws {Error} If constructed directly instead of using `create()`
 * @throws {Error} If created without setting a channel first
 * @throws {Error} If a follower is created with initial state
 * @throws {Error} If a follower cannot find its leader within 1 second
 */
export class UniversalStore<State, CustomEvent extends { type: string; payload?: any }> {
  /**
   * Defines the possible actor types in the store system
   *
   * @readonly
   */
  public static readonly ActorType = {
    LEADER: 'LEADER',
    FOLLOWER: 'FOLLOWER',
  } as const;

  /**
   * Defines the possible environments the store can run in
   *
   * @readonly
   */
  public static readonly Environment = {
    SERVER: 'SERVER',
    MANAGER: 'MANAGER',
    PREVIEW: 'PREVIEW',
  } as const;

  /**
   * Internal event types used for store synchronization
   *
   * @readonly
   */
  public static readonly InternalEventType = {
    EXISTING_STATE_REQUEST: '__EXISTING_STATE_REQUEST',
    EXISTING_STATE_RESPONSE: '__EXISTING_STATE_RESPONSE',
    SET_STATE: '__SET_STATE',
  } as const;

  public static readonly Status = {
    UNPREPARED: 'UNPREPARED',
    SYNCING: 'SYNCING',
    READY: 'READY',
    ERROR: 'ERROR',
  } as const;

  // To check if constructor was called from the static factory create()
  private static isInternalConstructing = false;

  private static preparation: {
    state: (typeof ProgressState)[keyof typeof ProgressState];
    resolve: (args: Awaited<typeof UniversalStore.preparation.promise>) => void;
    reject: (error: Error) => void;
    promise: Promise<{ channel: ChannelLike; environment: EnvironmentType }>;
  };

  static {
    UniversalStore.setupPreparationPromise();
  }

  private static setupPreparationPromise() {
    let resolveRef: typeof UniversalStore.preparation.resolve;
    let rejectRef: typeof UniversalStore.preparation.reject;

    const promise = new Promise<Awaited<typeof UniversalStore.preparation.promise>>(
      (resolve, reject) => {
        resolveRef = (args) => {
          UniversalStore.preparation.state = ProgressState.RESOLVED;
          resolve(args);
        };
        rejectRef = (...args) => {
          UniversalStore.preparation.state = ProgressState.REJECTED;
          reject(args);
        };
      }
    );

    UniversalStore.preparation = {
      state: ProgressState.PENDING,
      resolve: resolveRef!,
      reject: rejectRef!,
      promise,
    };
  }

  public get status() {
    switch (UniversalStore.preparation.state) {
      case ProgressState.PENDING:
        return UniversalStore.Status.UNPREPARED;
      case ProgressState.REJECTED:
        return UniversalStore.Status.ERROR;
      case ProgressState.RESOLVED:
      default:
    }
    switch (this.syncing?.state) {
      case ProgressState.PENDING:
      case undefined:
        return UniversalStore.Status.SYNCING;
      case ProgressState.REJECTED:
        return UniversalStore.Status.ERROR;
      case ProgressState.RESOLVED:
      default:
        return UniversalStore.Status.READY;
    }
  }

  public untilReady = () => {
    return Promise.all([UniversalStore.preparation.promise, this.syncing?.promise]);
  };

  private syncing?: {
    state: (typeof ProgressState)[keyof typeof ProgressState];
    promise?: Promise<void>;
    resolve?: () => void;
    reject?: (error: Error) => void;
  };

  // To store the channel instance for the current environment
  private static channel: ChannelLike;

  // To store the current environment
  private static environment: (typeof UniversalStore.Environment)[keyof typeof UniversalStore.Environment];

  /** Enable debug logs for this store */
  public debugging = false;

  /** The actor object representing the store instance with a unique ID and a type */
  readonly actor: Actor;

  private channelEventName: string;

  private state: State;

  // TODO: narrow type of listeners based on event type
  private listeners: Map<string, Set<Listener<Event<State, CustomEvent>>>> = new Map([
    ['*', new Set()],
  ]);

  private id: string;

  private constructor(options: StoreOptions<State>) {
    this.debugging = options.debug ?? false;
    // This constructor is a simulated private constructor as described in
    // it can only be called from within the static factory method create()
    // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_propertiessimulating_private_constructors
    if (!UniversalStore.isInternalConstructing) {
      throw new TypeError(
        'UniversalStore is not constructable - use UniversalStore.create() instead'
      );
    }
    UniversalStore.isInternalConstructing = false;

    if (!options.leader && typeof options.initialState !== 'undefined') {
      throw new TypeError(
        `setting initialState requires that leader is also true, when creating a UniversalStore. id: '${options.id}'`
      );
    }

    this.id = options.id;
    this.actor = {
      id: globalThis.crypto.randomUUID(),
      type: options.leader ? UniversalStore.ActorType.LEADER : UniversalStore.ActorType.FOLLOWER,
      environment: undefined as any, // Will be set later when the preparation promise has resolved
    };
    this.state = options.initialState as State;
    this.channelEventName = `${CHANNEL_EVENT_PREFIX}${this.id}`;

    this.debug('constructor', { options, channelEventName: this.channelEventName });

    if (this.actor.type === UniversalStore.ActorType.LEADER) {
      // If this is a leader, resolve the syncing promise immediately
      // because the state doesn't need to be synced
      this.syncing = {
        state: ProgressState.RESOLVED,
        promise: Promise.resolve(),
      };
    } else {
      // Set up the syncing promise for followers, that will be resolved when the state
      // is synced with the leader
      let syncingResolve: () => void;
      let syncingReject: (error: Error) => void;
      const syncingPromise = new Promise<void>((resolve, reject) => {
        syncingResolve = () => {
          if (this.syncing!.state !== ProgressState.PENDING) {
            return;
          }
          this.syncing!.state = ProgressState.RESOLVED;
          resolve();
        };
        syncingReject = (reason) => {
          if (this.syncing!.state !== ProgressState.PENDING) {
            return;
          }
          this.syncing!.state = ProgressState.REJECTED;
          reject(reason);
        };
      });
      this.syncing = {
        state: ProgressState.PENDING,
        promise: syncingPromise,
        resolve: syncingResolve!,
        reject: syncingReject!,
      };
    }

    UniversalStore.preparation.promise.then(({ channel, environment }) => {
      this.debug('prepared');
      this.actor.environment = environment;
      UniversalStore.channel.on(this.channelEventName, this.handleChannelEvents);

      if (this.actor.type === UniversalStore.ActorType.FOLLOWER) {
        // 1. Emit a request for the existing state
        this.emitToChannel(
          {
            type: UniversalStore.InternalEventType.EXISTING_STATE_REQUEST,
          },
          { actor: this.actor }
        );
        // 2. Wait 1 sec for a response, then reject the syncing promise if not already resolved
        setTimeout(() => {
          // if the state is already resolved by a response before this timeout,
          // rejecting it doesn't do anything, it will be ignored
          this.syncing!.reject!(
            new TypeError(
              `No existing state found for follower with id: '${options.id}'. Make sure a leader with the same id exists before creating a follower.`
            )
          );
        }, 1000);
      }
    });
  }

  /**
   * Creates a new instance of UniversalStore
   *
   * @template State The type of the state
   * @template CustomEvent The type of custom events
   * @param {StoreOptions<State>} options Configuration options for the store
   * @returns {UniversalStore<State, CustomEvent>} A new store instance
   * @static
   */
  static create<
    State = any,
    CustomEvent extends { type: string; payload?: any } = { type: string; payload?: any },
  >(options: StoreOptions<State>): UniversalStore<State, CustomEvent> {
    if (!options || typeof options?.id !== 'string') {
      throw new TypeError('id is required and must be a string, when creating a UniversalStore');
    }
    if (options.debug) {
      console.log(
        dedent`[UniversalStore:${UniversalStore.environment}]
        create`,
        { options }
      );
    }

    const existing = instances.get(options.id);
    if (existing) {
      console.warn(dedent`UniversalStore with id "${options.id}" already exists in this environment, re-using existing.
        You should reuse the existing instance instead of trying to create a new one.`);
      return existing;
    }

    UniversalStore.isInternalConstructing = true;
    const store = new UniversalStore<State, CustomEvent>(options);
    instances.set(options.id, store);
    return store;
  }

  /**
   * Used by Storybook to set the channel for all instances of UniversalStore in the given
   * environment.
   *
   * @internal
   */
  static __prepare(
    channel: ChannelLike,
    environment: (typeof UniversalStore.Environment)[keyof typeof UniversalStore.Environment]
  ) {
    UniversalStore.channel = channel;
    UniversalStore.environment = environment;
    UniversalStore.preparation.resolve({ channel, environment });
  }

  /**
   * Gets the current state
   *
   * @returns {State} The current state
   */
  public getState = (selector?: ((state?: State) => any) | undefined): State | undefined => {
    this.debug('getState', { state: this.state, selector });

    if (this.status !== UniversalStore.Status.READY) {
      return undefined;
    }

    return selector ? selector(this.state) : this.state;
  };

  /**
   * Updates the store's state
   *
   * @param {State | StateUpdater<State>} updater New state or state updater function
   */
  public setState = (updater: State | StateUpdater<State>) => {
    const previousState = this.state;
    const newState =
      typeof updater === 'function' ? (updater as StateUpdater<State>)(previousState) : updater;

    this.debug('setState', { newState, previousState, updater });

    if (this.status !== UniversalStore.Status.READY) {
      throw new TypeError(
        dedent`Cannot set state before store is ready. You can get the current status with store.status,
        or await store.readyPromise to wait for the store to be ready before sending events.
        ${JSON.stringify(
          {
            newState,
            id: this.id,
            actor: this.actor,
            environment: UniversalStore.environment,
          },
          null,
          2
        )}`
      );
    }

    this.state = newState;
    const event = {
      type: UniversalStore.InternalEventType.SET_STATE,
      payload: {
        state: newState,
        previousState,
      },
    };
    this.emitToChannel(event, { actor: this.actor });
    this.emitToListeners(event, { actor: this.actor });
  };

  /**
   * Subscribes to store events
   *
   * @template TEvent Event type
   * @param {TEvent['type'] | Listener<TEvent>} eventTypeOrListener Event type or listener function
   * @param {Listener<Event<State, CustomEvent>>} [maybeListener] Listener function if first param
   *   is event type
   * @returns {() => void} Unsubscribe function
   */

  public subscribe = (
    eventTypeOrListener: Listener<Event<State, CustomEvent>> | string,
    maybeListener?: Listener<Event<State, CustomEvent>>
  ) => {
    // TODO: improve type safety in arguments
    // eventType shouldn't just be string and event should be inferred from type when two arguments are passed
    const subscribesToAllEvents = typeof eventTypeOrListener === 'function';

    const eventType = subscribesToAllEvents ? '*' : eventTypeOrListener;
    const listener = subscribesToAllEvents ? eventTypeOrListener : maybeListener;

    this.debug('subscribe', { eventType, listener });

    if (!listener) {
      throw new TypeError(
        `Missing first subscribe argument, or second if first is the event type, when subscribing to a UniversalStore with id '${this.id}'`
      );
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.debug('unsubscribe', { eventType, listener });
      if (!this.listeners.has(eventType)) {
        return;
      }
      this.listeners.get(eventType)!.delete(listener);
      if (this.listeners.get(eventType)?.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  };

  /**
   * Subscribes to state changes
   *
   * @param {function} listener Callback function called when state changes
   * @returns {() => void} Unsubscribe function
   */
  public onStateChange(
    listener: (state: State, previousState: State, eventInfo: EventInfo) => void,
    selector?: (state: State) => any | undefined
  ) {
    this.debug('onStateChange', { listener, selector });
    return this.subscribe(UniversalStore.InternalEventType.SET_STATE, ({ payload }, eventInfo) => {
      if (!selector) {
        listener(payload.state, payload.previousState, eventInfo);
        return;
      }

      const selectedState = selector(payload.state);
      const selectedPreviousState = selector(payload.previousState);

      const hasChanges = !isEqual(selectedState, selectedPreviousState);
      if (hasChanges) {
        listener(payload.state, payload.previousState, eventInfo);
      }
    });
  }

  /**
   * Sends a custom event through the store
   *
   * @param {CustomEvent} event The event to send
   */
  public send = (event: CustomEvent) => {
    this.debug('send', { event });
    if (this.status !== UniversalStore.Status.READY) {
      throw new TypeError(
        dedent`Cannot send event before store is ready. You can get the current status with store.status,
        or await store.readyPromise to wait for the store to be ready before sending events.
        ${JSON.stringify(
          {
            event,
            id: this.id,
            actor: this.actor,
            environment: UniversalStore.environment,
          },
          null,
          2
        )}`
      );
    }
    this.emitToListeners(event, { actor: this.actor });
    this.emitToChannel(event, { actor: this.actor });
  };

  private emitToListeners = (event: any, eventInfo: EventInfo) => {
    const eventTypeListeners = this.listeners.get(event.type);
    const everythingListeners = this.listeners.get('*');
    this.debug('emitToListeners', {
      event,
      eventInfo,
      eventTypeListeners,
      everythingListeners,
    });

    [...(eventTypeListeners ?? []), ...(everythingListeners ?? [])]?.forEach(
      (listener: Listener<CustomEvent>) => listener(event, eventInfo)
    );
  };

  private emitToChannel = (event: any, eventInfo: EventInfo) => {
    this.debug('emitToChannel', { event, eventInfo });
    UniversalStore.channel.emit(this.channelEventName, {
      event,
      eventInfo,
    });
  };

  private handleChannelEvents = (channelEvent: ChannelEvent<State, CustomEvent>) => {
    const { event, eventInfo } = channelEvent;

    if ([eventInfo.actor.id, eventInfo.forwardingActor?.id].includes(this.actor.id)) {
      // Ignore events from self
      this.debug('handleChannelEvents: IGNORING SELF', { channelEvent });
      return;
    }
    this.debug('handleChannelEvents', { channelEvent });

    if (this.actor.type === UniversalStore.ActorType.LEADER) {
      let shouldForwardEvent = true;
      switch (event.type) {
        case UniversalStore.InternalEventType.EXISTING_STATE_REQUEST:
          // No need to forward request events
          shouldForwardEvent = false;
          // Respond by emitting an event with the existing state
          const responseEvent: ExistingStateResponseEvent<State> = {
            type: UniversalStore.InternalEventType.EXISTING_STATE_RESPONSE,
            payload: this.state,
          };
          this.debug('handleChannelEvents: responding to existing state request', {
            responseEvent,
          });
          this.emitToChannel(responseEvent, { actor: this.actor });
          break;
      }
      if (shouldForwardEvent) {
        // Forward the event to followers in other environments
        this.debug('handleChannelEvents: forwarding event', { channelEvent });
        this.emitToChannel(event, { actor: eventInfo.actor, forwardingActor: this.actor });
      }
    }
    if (this.actor.type === UniversalStore.ActorType.FOLLOWER) {
      switch (event.type) {
        case UniversalStore.InternalEventType.EXISTING_STATE_RESPONSE:
          // TODO: always handle this event, or only the first time?
          // should we _always_ change the state, or only when undefined?
          if (this.state === undefined) {
            this.debug('handleChannelEvents: setting state from existing state response', {
              event,
            });
            this.state = event.payload;
            this.syncing!.resolve?.();
          }
          break;
      }
    }

    switch (event.type) {
      case UniversalStore.InternalEventType.SET_STATE:
        this.debug('handleChannelEvents: setting state', { event });
        this.state = event.payload.state;
        break;
    }

    this.emitToListeners(event, { actor: eventInfo.actor });
  };

  private debug = (message: string, data?: any) => {
    if (this.debugging) {
      console.debug(
        dedent`[UniversalStore::${this.id}::${UniversalStore.environment}]
        ${message}`,
        data,
        {
          actor: this.actor,
          state: this.state,
          status: this.status,
        }
      );
    }
  };

  /**
   * Used to reset the static fields of the UniversalStore class when cleaning up tests
   *
   * @internal
   */
  static __reset() {
    UniversalStore.setupPreparationPromise();
    UniversalStore.channel = undefined as any;
    UniversalStore.environment = undefined as any;
    UniversalStore.isInternalConstructing = false;
  }
}

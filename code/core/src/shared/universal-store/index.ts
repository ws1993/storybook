import dedent from 'ts-dedent';

import { instances } from './instances';
import type {
  Actor,
  ChannelLike,
  Event,
  EventInfo,
  ExistingStateResponseEvent,
  Listener,
  SetStateEvent,
  StateUpdater,
  StoreOptions,
} from './types';

const CHANNEL_EVENT_PREFIX = 'UNIVERSAL_STORE:' as const;

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
  static readonly ActorType = {
    LEADER: 'LEADER',
    FOLLOWER: 'FOLLOWER',
  } as const;

  /**
   * Defines the possible environments the store can run in
   *
   * @readonly
   */
  static readonly Environment = {
    SERVER: 'SERVER',
    MANAGER: 'MANAGER',
    PREVIEW: 'PREVIEW',
  } as const;

  /**
   * Internal event types used for store synchronization
   *
   * @readonly
   */
  static readonly InternalEventTypes = {
    EXISTING_STATE_REQUEST: '__EXISTING_STATE_REQUEST',
    EXISTING_STATE_RESPONSE: '__EXISTING_STATE_RESPONSE',
    SET_STATE: '__SET_STATE',
  } as const;

  /** The current environment the UniversalStore is in */
  static get currentEnvironment() {
    if (!this.environment) {
      throw new TypeError(
        'Cannot read currentEnvironment from UniversalStore before Storybook has prepared the environment for it.'
      );
    }
    return this.environment;
  }

  // Private field to check if constructor was called from the static factory create()
  static isInternalConstructing = false;

  // Private field to store the channel instance for the current environment
  static channel: ChannelLike;

  // Private field to store the current environment
  static environment: (typeof UniversalStore.Environment)[keyof typeof UniversalStore.Environment];

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

    if (!UniversalStore.channel) {
      throw new TypeError(
        `UniversalStore with id ${options.id} was created before Storybook had prepared the environment for it, which is not allowed.`
      );
    }

    this.id = options.id;
    this.actor = {
      id: crypto.randomUUID(),
      type: options.leader ? UniversalStore.ActorType.LEADER : UniversalStore.ActorType.FOLLOWER,
    };
    this.state = options.initialState as State;
    this.channelEventName = `${CHANNEL_EVENT_PREFIX}${this.id}`;

    this.debug('constructor', { options, channelEventName: this.channelEventName });

    debugger;
    UniversalStore.channel.on(this.channelEventName, this.handleChannelEvents);
    if (this.actor.type === UniversalStore.ActorType.FOLLOWER) {
      // 1. Emit a request for the existing state
      this.emitToChannel({
        type: UniversalStore.InternalEventTypes.EXISTING_STATE_REQUEST,
      });
      // 2. Wait 1 sec for a response, then throw if no state was found
      setTimeout(() => {
        if (this.state === undefined) {
          throw new TypeError(
            `No existing state found for follower with id: '${options.id}'. Make sure a leader with the same id exists before creating a follower.`
          );
        }
      }, 1000);
    }
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
    if (options.debug) {
      console.log(
        dedent`[UniversalStore:${UniversalStore.currentEnvironment}]
        create`,
        { options }
      );
    }
    if (typeof options?.id !== 'string') {
      throw new TypeError('id is required and must be a string, when creating a UniversalStore');
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
    console.log('LOG: __prepare', { channel, environment });
    UniversalStore.channel = channel;
    UniversalStore.environment = environment;
  }

  /**
   * Gets the current state
   *
   * @returns {State} The current state
   */
  public getState(): State {
    this.debug('getState', { state: this.state });
    return this.state;
  }

  /**
   * Updates the store's state
   *
   * @param {State | StateUpdater<State>} updater New state or state updater function
   */
  public setState(updater: State | StateUpdater<State>) {
    const previousState = this.state;
    const newState =
      typeof updater === 'function' ? (updater as StateUpdater<State>)(previousState) : updater;

    this.debug('setState', { newState, previousState, updater });

    this.state = newState;
    const event = {
      type: UniversalStore.InternalEventTypes.SET_STATE,
      payload: {
        state: newState,
        previousState,
      },
    };
    this.emitToChannel(event);
    this.emitToListeners(event);
  }

  /**
   * Subscribes to store events
   *
   * @template TEvent Event type
   * @param {TEvent['type'] | Listener<TEvent>} eventTypeOrListener Event type or listener function
   * @param {Listener<Event<State, CustomEvent>>} [maybeListener] Listener function if first param
   *   is event type
   * @returns {() => void} Unsubscribe function
   */
  public subscribe<TEvent extends Event<State, CustomEvent>>(
    eventType: TEvent['type'],
    listener: Listener<TEvent>
  ): () => void;
  public subscribe<TEvent extends Event<State, CustomEvent>>(
    listener: Listener<TEvent>
  ): () => void;
  public subscribe<TEvent extends Event<State, CustomEvent>>(
    eventTypeOrListener: TEvent['type'] | Listener<Event<State, CustomEvent>>,
    maybeListener?: Listener<Event<State, CustomEvent>>
  ) {
    // TODO: improve parameter typings here, to narrow the listener type based on the event type
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
  }

  /**
   * Subscribes to state changes
   *
   * @param {function} listener Callback function called when state changes
   * @returns {() => void} Unsubscribe function
   */
  public onStateChange(
    listener: (state: State, previousState: State, eventInfo: EventInfo) => void
  ) {
    this.debug('onStateChange', { listener });
    return this.subscribe<SetStateEvent<State>>(
      UniversalStore.InternalEventTypes.SET_STATE,
      ({ payload }, eventInfo) => {
        listener(payload.state, payload.previousState, eventInfo);
      }
    );
  }

  /**
   * Sends a custom event through the store
   *
   * @param {CustomEvent} event The event to send
   */
  public send(event: CustomEvent) {
    this.debug('send', { event });
    this.emitToListeners(event);
    this.emitToChannel(event);
  }

  private emitToListeners = (event: any) => {
    const emit = (listener: Listener<CustomEvent>) => listener(event, { actor: this.actor });

    const eventTypeListeners = this.listeners.get(event.type);
    const everythingListeners = this.listeners.get('*');
    this.debug('emitToListeners', {
      event,
      eventTypeListeners,
      everythingListeners,
    });

    eventTypeListeners?.forEach(emit);
    everythingListeners?.forEach(emit);
  };

  private emitToChannel = (event: any) => {
    this.debug('emitToChannel', { event });
    UniversalStore.channel.emit(this.channelEventName, {
      ...event,
      actor: this.actor,
    });
  };

  private handleChannelEvents = (event: any) => {
    if ([event.actor.id, event.originalActor?.id].includes(this.actor.id)) {
      // Ignore events from self
      this.debug('handleChannelEvents: IGNORING SELF', { event });
      return;
    }
    this.debug('handleChannelEvents', { event });

    if (this.actor.type === UniversalStore.ActorType.LEADER) {
      let shouldForwardEvent = true;
      switch (event.type) {
        case UniversalStore.InternalEventTypes.EXISTING_STATE_REQUEST:
          // No need to forward request events
          shouldForwardEvent = false;
          // Respond by emitting an event with the existing state
          const responseEvent: ExistingStateResponseEvent<State> = {
            type: UniversalStore.InternalEventTypes.EXISTING_STATE_RESPONSE,
            payload: this.state,
          };
          this.debug('handleChannelEvents: responding to existing state request', {
            responseEvent,
          });
          this.emitToChannel(responseEvent);
          break;
      }
      if (shouldForwardEvent) {
        // Forward the event to followers in other environments
        this.debug('handleChannelEvents: forwarding event', { event });
        this.emitToChannel({ ...event, originalActor: event.actor });
      }
    }
    if (this.actor.type === UniversalStore.ActorType.FOLLOWER) {
      switch (event.type) {
        case UniversalStore.InternalEventTypes.EXISTING_STATE_RESPONSE:
          // TODO: always handle this event, or only the first time?
          // should we _always_ change the state, or only when undefined?
          if (this.state === undefined) {
            this.debug('handleChannelEvents: setting state from existing state response', {
              event,
            });
            this.state = event.payload;
          }
          break;
      }
    }

    switch (event.type) {
      // TOOD: Do we need to care about the actor type here?
      case UniversalStore.InternalEventTypes.SET_STATE:
        this.debug('handleChannelEvents: setting state', { event });
        this.state = event.payload.state;
        break;
    }
  };

  private debug = (message: string, data?: any) => {
    if (this.debugging) {
      console.debug(
        dedent`[UniversalStore::${this.id}::${UniversalStore.currentEnvironment}]
        ${message}`,
        data,
        {
          actor: this.actor,
          state: this.state,
        }
      );
    }
  };
}

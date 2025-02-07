import { UniversalStore } from '.';
import type { ExistingStateResponseEvent, StoreOptions } from './types';

/**
 * A mock universal store that can be used when testing code that relies on a universal store. It
 * functions exactly like a normal universal store.
 *
 * If the code under test uses a Follower store, create a Leader MockUniversalStore with the same
 * configuration, to satisfy the Follower's need for a leader to exist.
 *
 * If the code under test uses a Leader store, you can create a follower MockUniversalStore with the
 * same configuration to listen for state changes, events, or anything else you need to, to test the
 * leader.
 */
export class MockUniversalStore<
  State,
  CustomEvent extends { type: string; payload?: any },
> extends UniversalStore<State, CustomEvent> {
  public constructor(options: StoreOptions<State>) {
    UniversalStore.isInternalConstructing = true;
    super(options);
    UniversalStore.isInternalConstructing = false;

    if (this.actor.type === UniversalStore.ActorType.LEADER) {
      this.untilReady().then(() => {
        // always send an existing state response event asap, because
        // a follower might be waiting for it because it was created before this mock leader
        const responseEvent: ExistingStateResponseEvent<State> = {
          type: UniversalStore.InternalEventType.EXISTING_STATE_RESPONSE,
          payload: this.getState(),
        };
        this.send(responseEvent as any);
      });
    }
  }

  /** Create a mock universal store. This is just an alias for new MockUniversalStore(options). */
  static create<
    State = any,
    CustomEvent extends { type: string; payload?: any } = { type: string; payload?: any },
  >(options: StoreOptions<State>): UniversalStore<State, CustomEvent> {
    return new MockUniversalStore(options);
  }
}

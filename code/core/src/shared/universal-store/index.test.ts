/* eslint-disable no-underscore-dangle */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UniversalStore } from '.';
import { instances as mockedInstances } from './__mocks__/instances';

vi.mock('./instances');

const mockChannelListeners = new Map<string, Set<(...args: any[]) => void>>();

const mockChannel = {
  on: vi.fn((eventType: string, listener: (...args: any[]) => void) => {
    const [universalStorePrefix, environmentId, universalStoreId] = eventType.split(':');
    if (!mockChannelListeners.has(universalStoreId)) {
      mockChannelListeners.set(universalStoreId, new Set());
    }
    const listeners = mockChannelListeners.get(universalStoreId)!;
    listeners.add(listener);
  }),
  off: vi.fn((eventType: string, listener: (...args: any[]) => void) => {
    const universalStoreId = eventType.split(':')[2];
    if (!mockChannelListeners.has(universalStoreId)) {
      return;
    }
    const listeners = mockChannelListeners.get(universalStoreId)!;
    listeners.delete(listener);
  }),
  emit: vi.fn((eventType: string, ...args: any) => {
    const [universalStorePrefix, environmentId, universalStoreId] = eventType.split(':');
    if (!mockChannelListeners.has(universalStoreId)) {
      return;
    }
    const listeners = mockChannelListeners.get(universalStoreId)!;
    setTimeout(() => {
      // TODO: this is a simplification, emulating that the event is emitted asynchronously
      // in reality, it would be synchronous within the same environment, but async across environments
      listeners.forEach((listener) => listener(...args));
    }, 0);
  }),
};

describe('UniversalStore', () => {
  beforeEach(() => {
    mockedInstances.clearAllEnvironments();
    mockChannelListeners.clear();
    UniversalStore.__prepare(mockChannel, UniversalStore.Environment.MANAGER);
    vi.useRealTimers();
  });

  describe('Creation', () => {
    describe('Leader', () => {
      it('should create a new leader instance with initial state', () => {
        // Arrange - mock the randomUUID function to return a known value
        const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('random-uuid-1-2-3-4');

        // Act - create a new leader instance
        const store = UniversalStore.create({
          id: 'env1:test',
          leader: true,
          initialState: { count: 0 },
        });

        // Assert - the store should be created with the initial state and actor
        expect(store.getState()).toEqual({ count: 0 });
        expect(store.actor.type).toBe('LEADER');
        expect(store.actor.id).toBe('random-uuid-1-2-3-4');

        // Cleanup - restore the original function
        uuidSpy.mockRestore();
      });

      it('should throw when trying to create an instance with the constructor directly', () => {
        // Act, Assert - creating an instance with the constructor and expect it to throw
        expect(
          () =>
            new (UniversalStore as any)({
              id: 'env1:test',
              leader: true,
            })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Invariant failed: UniversalStore is not constructable - use UniversalStore.create() instead]`
        );
      });

      it('should throw when id is not provided', () => {
        // Arrange, Act, Assert - creating an instance without an id and expect it to throw
        expect(() => (UniversalStore as any).create()).toThrowErrorMatchingInlineSnapshot(
          `[Error: Invariant failed: id is required and must be a string, when creating a UniversalStore]`
        );
      });

      it('should throw when creating a store before it has been prepared', () => {
        // Arrange - unset the channel and environment
        UniversalStore.__prepare(undefined as any, undefined as any);

        // Act, Assert - creating a store without a channel and expect it to throw
        expect(() =>
          UniversalStore.create({
            id: 'env1:test',
            leader: true,
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Invariant failed: UniversalStore with id env1:test was created before Storybook had prepared the environment for it, which is not allowed.]`
        );
      });

      it('should re-use an existing instance when creating a new one with the same id', () => {
        // Arrange - mock the console.warn function
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act - create two stores with the same id
        const firstStore = UniversalStore.create({
          id: 'env1:test',
          leader: true,
        });
        const secondStore = UniversalStore.create({
          id: 'env1:test',
          leader: true,
        });

        // Assert - the second store should be the same as the first, and a warning should be logged
        expect(secondStore).toBe(firstStore);
        expect(mockedInstances.set).toHaveBeenCalledOnce();
        expect(console.warn)
          .toHaveBeenCalledExactlyOnceWith(`UniversalStore with id \"env1:test\" already exists in this environment, re-using existing.
You should reuse the existing instance instead of trying to create a new one.`);
      });

      it('should not re-use an existing instance when creating a new one with a different id', () => {
        // Arrange - mock the console.warn function
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act - create two stores with different ids
        const firstStore = UniversalStore.create({
          id: 'env1:test-1',
          leader: true,
        });
        const secondStore = UniversalStore.create({
          id: 'env1:test-2',
          leader: true,
        });

        // Assert - the second store should not be the same as the first, and a warning should not be logged
        expect(secondStore).not.toBe(firstStore);
        expect(mockedInstances.set).toHaveBeenCalledTimes(2);
        expect(console.warn).not.toBeCalled();
      });

      it('should subscribe to the channel for changes', () => {
        // Act - create a new leader instance
        UniversalStore.create({
          id: 'env1:test',
          leader: true,
        });

        // Assert - the store should subscribe to the channel
        expect(mockChannel.on).toHaveBeenCalledWith(
          'UNIVERSAL_STORE:env1:test',
          expect.any(Function)
        );
      });
    });

    describe('Follower', () => {
      it('should create a new follower instance', () => {
        // Arrange - mock the randomUUID function to return a known value
        const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('random-uuid-1-2-3-4');

        // Act - create a new follower instance
        const store = UniversalStore.create({
          id: 'env1:test',
          leader: false,
        });

        // Assert - the store should be created with the initial state and actor
        expect(store.getState()).toEqual(undefined);
        expect(store.actor.type).toBe('FOLLOWER');
        expect(store.actor.id).toBe('random-uuid-1-2-3-4');

        // Cleanup - restore the original uuid function
        uuidSpy.mockRestore();
      });

      it('should throw when initialState is set without leader: true', () => {
        // Act, Assert - creating a follower with an initial state and expect it to throw
        expect(() =>
          UniversalStore.create({
            id: 'env1:test',
            initialState: { count: 0 },
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Invariant failed: setting initialState requires that leader is also true, when creating a UniversalStore. id: 'env1:test']`
        );
      });

      it('should get existing state when a follower is created', async () => {
        // Act - create a leader and a follower
        const leader = UniversalStore.create({
          id: 'env1:test',
          leader: true,
          initialState: { count: 0 },
        });
        const follower = UniversalStore.create({
          id: 'env2:test',
          leader: false,
        });

        // Assert - the follower should eventually get the existing state from the leader
        await vi.waitFor(() => {
          expect(mockChannel.emit).toHaveBeenCalledTimes(2);
          expect(mockChannel.emit).toHaveBeenNthCalledWith(1, 'UNIVERSAL_STORE:env2:test', {
            type: UniversalStore.InternalEventTypes.EXISTING_STATE_REQUEST,
            actor: {
              type: UniversalStore.ActorType.FOLLOWER,
              id: follower.actor.id,
            },
          });
          expect(mockChannel.emit).toHaveBeenNthCalledWith(2, 'UNIVERSAL_STORE:env1:test', {
            type: UniversalStore.InternalEventTypes.EXISTING_STATE_RESPONSE,
            actor: {
              type: UniversalStore.ActorType.LEADER,
              id: leader.actor.id,
            },
            payload: leader.getState(),
          });
          expect(follower.getState()).toEqual(leader.getState());
        });
      });

      it('should throw when creating a follower without an existing leader', async () => {
        // Arrange - mock the timers to allow advancing
        vi.useFakeTimers();

        // Act - create a follower without a leader
        const follower = UniversalStore.create({
          id: 'env1:test',
          leader: false,
        });

        // Assert - the follower should request the existing state
        await vi.waitFor(() => {
          expect(mockChannel.emit).toHaveBeenCalledExactlyOnceWith('UNIVERSAL_STORE:env1:test', {
            type: UniversalStore.InternalEventTypes.EXISTING_STATE_REQUEST,
            actor: {
              type: UniversalStore.ActorType.FOLLOWER,
              id: follower.actor.id,
            },
          });
        });
        // Assert - eventually the follower should throw an error when the timeout is reached
        expect(() => vi.advanceTimersToNextTimer()).toThrowErrorMatchingInlineSnapshot(
          `[Error: Invariant failed: No existing state found for follower with id: 'env1:test'. Make sure a leader with the same id exists before creating a follower.]`
        );
      });
    });
  });

  describe('State', () => {
    it('should get the current state', () => {
      // Act - create a store with initial state
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });

      // Assert - the state should be the initial state
      expect(store.getState()).toEqual({ count: 0 });
    });

    it('should update the state', () => {
      // Arrange - create a store and add a state change listener
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });

      // Act - replace the state
      store.setState({ count: 1 });

      // Assert - the state should be updated
      expect(store.getState()).toEqual({ count: 1 });

      // Act - update the state with an updater function
      store.setState((s) => ({ count: s.count + 1 }));

      // Assert - the state should be updated
      expect(store.getState()).toEqual({ count: 2 });
    });

    it('should emit the state change to the channel', () => {
      // Arrange - create a store
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });

      // Act - replace the state
      store.setState({ count: 1 });

      // Assert - the state change should be emitted on the channel
      expect(mockChannel.emit).toHaveBeenCalledExactlyOnceWith('UNIVERSAL_STORE:env1:test', {
        type: UniversalStore.InternalEventTypes.SET_STATE,
        actor: store.actor,
        payload: {
          state: { count: 1 },
          previousState: { count: 0 },
        },
      });
    });

    it('should emit the state change to the listeners', () => {
      // Arrange - create a store and add a state change listener and a full listener
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });
      const stateChangeListener = vi.fn();
      const fullListener = vi.fn();
      store.onStateChange(stateChangeListener);
      store.subscribe(UniversalStore.InternalEventTypes.SET_STATE, fullListener);

      // Act - replace the state
      store.setState({ count: 1 });

      // Assert - the state should be updated and the listener should be called
      expect(stateChangeListener).toHaveBeenCalledExactlyOnceWith(
        { count: 1 },
        { count: 0 },
        { actor: store.actor }
      );
      expect(fullListener).toHaveBeenCalledExactlyOnceWith(
        {
          type: UniversalStore.InternalEventTypes.SET_STATE,
          payload: {
            state: { count: 1 },
            previousState: { count: 0 },
          },
        },
        { actor: store.actor }
      );
    });

    it('should update own state when channel emits state change', async () => {
      // Arrange - create a leader and a follower, and wait for them to be in sync
      const leader = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });
      const follower = UniversalStore.create({
        id: 'env2:test',
        leader: false,
      });
      await vi.waitFor(() => {
        expect(follower.getState()).toEqual({ count: 0 });
      });

      // Act - update leader state
      leader.setState({ count: 1 });

      // Assert - the follower should update its state
      await vi.waitFor(() => {
        expect(follower.getState()).toEqual({ count: 1 });
      });
    });

    it('should re-emit the state change to the channel when a leader gets it', async () => {
      // Arrange - create a leader and a follower, and wait for them to be in sync
      const leader = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });
      const follower = UniversalStore.create({
        id: 'env2:test',
        leader: false,
      });
      await vi.waitFor(() => {
        expect(follower.getState()).toEqual({ count: 0 });
      });

      // Act - update follower state
      follower.setState({ count: 1 });

      // Assert - the leader should update its state and re-emit the change to any followers in other environments
      await vi.waitFor(() => {
        expect(leader.getState()).toEqual({ count: 1 });
        expect(mockChannel.emit).toHaveBeenCalledTimes(4);
        expect(mockChannel.emit).toHaveBeenNthCalledWith(3, 'UNIVERSAL_STORE:env2:test', {
          type: UniversalStore.InternalEventTypes.SET_STATE,
          payload: {
            state: { count: 1 },
            previousState: { count: 0 },
          },
          actor: {
            type: UniversalStore.ActorType.FOLLOWER,
            id: follower.actor.id,
          },
        });
        expect(mockChannel.emit).toHaveBeenNthCalledWith(4, 'UNIVERSAL_STORE:env1:test', {
          type: UniversalStore.InternalEventTypes.SET_STATE,
          payload: {
            state: { count: 1 },
            previousState: { count: 0 },
          },
          actor: {
            type: UniversalStore.ActorType.LEADER,
            id: leader.actor.id,
          },
          originalActor: {
            type: UniversalStore.ActorType.FOLLOWER,
            id: follower.actor.id,
          },
        });
      });
    });
  });

  describe('Events', () => {
    it('should call listeners for specific events', () => {
      // Arrange - create a store and add a listener
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });
      const listener = vi.fn();
      store.subscribe('CUSTOM_EVENT_TYPE', listener);

      // Act - send the event
      store.send({ type: 'CUSTOM_EVENT_TYPE', payload: { foo: 'bar' } });

      // Assert - the listener should be called
      expect(listener).toHaveBeenCalledExactlyOnceWith(
        {
          type: 'CUSTOM_EVENT_TYPE',
          payload: { foo: 'bar' },
        },
        { actor: store.actor }
      );
    });

    it('should call listeners for all events', () => {
      // Arrange - create a store and add a listener
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });
      const listener = vi.fn();
      store.subscribe(listener);

      // Act - send the event
      store.send({ type: 'CUSTOM_EVENT_TYPE', payload: { foo: 'bar' } });

      // Assert - the listener should be called
      expect(listener).toHaveBeenCalledExactlyOnceWith(
        {
          type: 'CUSTOM_EVENT_TYPE',
          payload: { foo: 'bar' },
        },
        { actor: store.actor }
      );
    });

    it('should unsubscribe listeners from events', () => {
      // Arrange - create a store, add a listener, send an event, and then remove the listener
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      store.send({ type: 'CUSTOM_EVENT_TYPE', payload: { foo: 'bar' } });
      expect(listener).toHaveBeenCalledOnce();
      listener.mockClear();

      // Act - unsubscribe the listener and send the event again
      unsubscribe();
      store.send({ type: 'CUSTOM_EVENT_TYPE', payload: { baz: 'meh' } });

      // Assert - the listener should not be called
      expect(listener).not.toBeCalled();
    });

    it('should emit events on the channel', () => {
      // Arrange - create a store
      const store = UniversalStore.create({
        id: 'env1:test',
        leader: true,
        initialState: { count: 0 },
      });

      // Act - send the event
      store.send({ type: 'CUSTOM_EVENT_TYPE', payload: { foo: 'bar' } });

      // Assert - the event should be emitted on the channel
      expect(mockChannel.emit).toHaveBeenCalledWith('UNIVERSAL_STORE:env1:test', {
        type: 'CUSTOM_EVENT_TYPE',
        payload: { foo: 'bar' },
        actor: store.actor,
      });
    });
  });
});

import { describe, expectTypeOf, it } from 'vitest';

import { UniversalStore } from '.';

describe('UniversalStore', () => {
  it('should have any types without State or Event specified', () => {
    const store = UniversalStore.create({ id: 'test' });
    expectTypeOf(store).toEqualTypeOf<UniversalStore<any, { type: string; payload?: any }>>();
  });

  it('should have the correct types for State', () => {
    type State = { count: number; done: boolean };
    const store = UniversalStore.create<State>({ id: 'test' });
    expectTypeOf(store).toEqualTypeOf<UniversalStore<State, { type: string; payload?: any }>>();

    expectTypeOf(store.getState()).toEqualTypeOf<State | undefined>();
    expectTypeOf(store.setState).parameter(0).toEqualTypeOf<State | ((state: State) => State)>();
    expectTypeOf(store.onStateChange).parameter(0).parameter(0).toEqualTypeOf<State>();
  });

  it('should have the correct types for CustomEvent', () => {
    type State = { count: number; done: boolean };
    type CustomEvent =
      | {
          type: 'INCREMENT';
          payload: number;
        }
      | { type: 'TOGGLE' };
    const store = UniversalStore.create<State, CustomEvent>({ id: 'test' });
    expectTypeOf(store).toEqualTypeOf<UniversalStore<State, CustomEvent>>();

    expectTypeOf(store.send).parameter(0).toEqualTypeOf<CustomEvent>();
    // TODO: expect correct type from store.subscribe()
  });
});

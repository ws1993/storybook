import { useEffect, useState } from '@storybook/core/preview-api';

import type { UniversalStore } from './index';

/**
 * A hook to use a UniversalStore in a rendered preview. This hook will react to changes in the
 * store state and re-render when the store changes.
 *
 * @param universalStore The UniversalStore instance to use.
 * @param selector An optional selector function to select a subset of the store state.
 * @remark This hook is intended for use in the preview. For use in the manager UI, import from
 * `storybook/internal/manager-api` instead.
 */
export const useUniversalStore = <
  TUniversalStore extends UniversalStore<any, any>,
  TState extends ReturnType<TUniversalStore['getState']>,
  TSelectedState = NonNullable<TState>,
>(
  universalStore: TUniversalStore,
  selector?: (state: TState) => TSelectedState
): [TSelectedState, TUniversalStore['setState']] => {
  const [state, setState] = useState(universalStore.getState(selector));

  useEffect(() => {
    const stateChangeHandler = (nextState: NonNullable<TState>) => {
      setState(selector ? selector(nextState) : nextState);
    };
    return universalStore.onStateChange(stateChangeHandler, selector);
  }, [universalStore, setState, selector]);

  return [state, universalStore.setState];
};

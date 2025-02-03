import { useEffect, useState } from '@storybook/core/preview-api';

import type { UniversalStore } from './index';

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

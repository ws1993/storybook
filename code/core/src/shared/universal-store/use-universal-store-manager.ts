import * as React from 'react';

import type { UniversalStore } from './index';

export const useUniversalStore = <
  TUniversalStore extends UniversalStore<any, any>,
  TState extends ReturnType<TUniversalStore['getState']>,
  TSelectedState = NonNullable<TState>,
>(
  universalStore: TUniversalStore,
  selector?: (state: TState) => TSelectedState
): [TSelectedState, TUniversalStore['setState']] => {
  const subscribe = React.useCallback<Parameters<(typeof React)['useSyncExternalStore']>[0]>(
    (listener) => universalStore.onStateChange(listener, selector),
    [universalStore, selector]
  );

  const getSnapshot = React.useCallback(
    () => universalStore.getState(selector),
    [universalStore, selector]
  );

  const state = React.useSyncExternalStore<TState>(subscribe, getSnapshot);

  return [state, universalStore.setState];
};

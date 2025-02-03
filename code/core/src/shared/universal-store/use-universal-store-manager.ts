import * as React from 'react';

import type { UniversalStore } from './index';

/**
 * A hook to use a UniversalStore in the manager UI (eg. in an addon panel). This hook will react to
 * changes in the store state and re-render when the store changes.
 *
 * @param universalStore The UniversalStore instance to use.
 * @param selector An optional selector function to select a subset of the store state.
 * @remark This hook is intended for use in the manager UI. For use in the preview, import from
 * `storybook/internal/preview-api` instead.
 */
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

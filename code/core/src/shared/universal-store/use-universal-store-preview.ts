// import * as React from 'react';
// import type { UniversalStore } from './index';
// export const useUniversalStore = <
//   TUniversalStore extends UniversalStore<any, any>,
//   TState = ReturnType<TUniversalStore['getState']>,
// >(
//   universalStore: TUniversalStore,
//   selector?: (state: TState) => any
// ): [TState, React.Dispatch<React.SetStateAction<TState>>] => {
//   const subscribe = React.useCallback<Parameters<(typeof React)['useSyncExternalStore']>[0]>(
//     (listener) => universalStore.onStateChange(listener, selector),
//     [universalStore, selector]
//   );
//   const getSnapshot = React.useCallback(
//     () => universalStore.getState(selector),
//     [universalStore, selector]
//   );
//   const state = React.useSyncExternalStore<TState>(subscribe, getSnapshot);
//   return [state, universalStore.setState];
// };
import { useCallback, useEffect, useState } from '@storybook/core/preview-api';

import type { UniversalStore } from './index';

export const useUniversalStore = <
  TUniversalStore extends UniversalStore<any, any>,
  TState extends ReturnType<TUniversalStore['getState']>,
>(
  universalStore: TUniversalStore
): [TState, any] => {
  const [state, setState] = useState(universalStore.getState());

  useEffect(() => {
    console.warn('LOG PREVIEW: subscribing to universal state');
    const listener = (nextState: TState) => {
      console.warn('LOG PREVIEW: universal state updated, setting internal state', nextState);
      setState(nextState);
    };
    return universalStore.subscribe(listener);
  }, [universalStore, setState]);

  useEffect(() => {
    console.warn('LOG PREVIEW: internal state set', state, universalStore.getState() !== state);
    if (universalStore.state !== state) {
      universalStore.state = state;
    }
  }, [state, universalStore]);

  return [state, setState];
};

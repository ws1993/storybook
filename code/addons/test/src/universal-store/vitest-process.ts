import { experimental_UniversalStore } from 'storybook/internal/core-server';

import {
  type UniversalStoreEvent,
  type UniversalStoreState,
  universalStoreConfig,
} from '../constants';

export const getStore = () =>
  experimental_UniversalStore.create<UniversalStoreState, UniversalStoreEvent>(
    universalStoreConfig
  );

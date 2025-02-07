import { experimental_UniversalStore } from 'storybook/internal/manager-api';

import {
  type UniversalStoreEvent,
  type UniversalStoreState,
  universalStoreConfig,
} from './constants';

export const store = experimental_UniversalStore.create<UniversalStoreState, UniversalStoreEvent>(
  universalStoreConfig
);

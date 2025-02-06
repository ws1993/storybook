import { experimental_UniversalStore } from 'storybook/internal/core-server';

import {
  type UniversalStoreEvent,
  type UniversalStoreState,
  universalStoreConfig,
} from '../constants';

export const universalStore = experimental_UniversalStore.create<
  UniversalStoreState,
  UniversalStoreEvent
>({
  ...universalStoreConfig,
  leader: true,
});

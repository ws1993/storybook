import { experimental_UniversalStore } from 'storybook/internal/manager-api';

import { type StoreEvent, type StoreState, storeConfig } from './constants';

export const store = experimental_UniversalStore.create<StoreState, StoreEvent>(storeConfig);

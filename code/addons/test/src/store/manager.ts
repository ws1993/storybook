import { experimental_UniversalStore } from 'storybook/internal/manager-api';

import { type StoreEvent, type StoreState, storeOptions } from '../constants';

export const store = experimental_UniversalStore.create<StoreState, StoreEvent>(storeOptions);

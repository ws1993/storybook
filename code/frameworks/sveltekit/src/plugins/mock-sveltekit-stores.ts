import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const filename = __filename ?? fileURLToPath(import.meta.url);
const dir = dirname(filename);

export function mockSveltekitStores() {
  return {
    name: 'storybook:sveltekit-mock-stores',
    config: () => ({
      resolve: {
        alias: {
          '$app/forms': resolve(dir, '../src/mocks/app/forms.ts'),
          '$app/navigation': resolve(dir, '../src/mocks/app/navigation.ts'),
          '$app/stores': resolve(dir, '../src/mocks/app/stores.ts'),
        },
      },
    }),
  } satisfies Plugin;
}

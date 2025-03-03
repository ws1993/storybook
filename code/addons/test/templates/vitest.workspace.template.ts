import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineWorkspace } from 'vitest/config';

import { storybookTest } from '@storybook/addon-test/vitest-plugin';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineWorkspace([
  'ROOT_CONFIG',
  {
    extends: 'EXTENDS_WORKSPACE',
    plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
      storybookTest({ configDir: path.join(dirname, 'CONFIG_DIR') }),
    ],
    test: {
      name: 'storybook',
      browser: BROWSER_CONFIG,
      setupFiles: ['SETUP_FILE'],
    },
  },
]);

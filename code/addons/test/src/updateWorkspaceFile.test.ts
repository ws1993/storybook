import { expect, it } from 'vitest';

import * as babel from 'storybook/internal/babel';

import { updateWorkspaceFile } from './updateWorkspaceFile';

const source = babel.babelParse(`
  import path from 'node:path';
  import { fileURLToPath } from 'node:url';
  import { defineWorkspace } from 'vitest/config';
  import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';

  const dirname = typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

  // More info at: https://storybook.js.org/docs/writing-tests/test-addon
  export default defineWorkspace([{
    extends: '${'./vitest.config.ts'}',
    plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
      storybookTest({ configDir: path.join(dirname, '${'.storybook'}') })
    ],
    test: {
      name: 'storybook',
    },
  }]);
`);

it('updates vitest workspace file using array syntax', async () => {
  const target = babel.babelParse(`
    export default ['packages/*']
  `);

  updateWorkspaceFile(source, target);
  const { code } = babel.generate(target);

  expect(code).toMatchInlineSnapshot(`
    "import path from 'node:path';
    import { fileURLToPath } from 'node:url';
    import { defineWorkspace } from 'vitest/config';
    import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';
    const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

    // More info at: https://storybook.js.org/docs/writing-tests/test-addon
    export default ['packages/*', {
      extends: './vitest.config.ts',
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook'
      }
    }];"
  `);
});

it('updates vitest workspace file using defineWorkspace syntax', async () => {
  const target = babel.babelParse(`
    import { defineWorkspace } from 'vitest/config'

    export default defineWorkspace(['packages/*'])
  `);

  updateWorkspaceFile(source, target);
  const { code } = babel.generate(target);

  expect(code).toMatchInlineSnapshot(`
    "import { defineWorkspace } from 'vitest/config';
    import path from 'node:path';
    import { fileURLToPath } from 'node:url';
    import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';
    const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

    // More info at: https://storybook.js.org/docs/writing-tests/test-addon
    export default defineWorkspace(['packages/*', {
      extends: './vitest.config.ts',
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook'
      }
    }]);"
  `);
});

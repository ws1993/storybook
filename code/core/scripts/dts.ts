import { join } from 'node:path';

import { dts, nodeInternals, process } from '../../../scripts/prepare/tools';
import pkg from '../package.json';
import { getEntries } from './entries';

async function run() {
  const cwd = process.cwd();

  const flags = process.argv.slice(2);

  const selection = flags[0] || 'all';

  const entries = getEntries(cwd);
  const external = [
    ...Object.keys((pkg as any).dependencies || {}),
    ...Object.keys((pkg as any).peerDependencies || {}),
    ...nodeInternals,
    'typescript',
    'storybook',

    'storybook/internal/builder-manager',
    'storybook/internal/channels',
    'storybook/internal/client-logger',
    'storybook/internal/common',
    'storybook/internal/components',
    'storybook/internal/core-events',
    'storybook/internal/core-server',
    'storybook/internal/csf-tools',
    'storybook/internal/docs-tools',
    'storybook/internal/manager-api',
    'storybook/internal/node-logger',
    'storybook/internal/preview-api',
    'storybook/internal/router',
    'storybook/internal/telemetry',
    'storybook/internal/theming',
    'storybook/internal/types',
  ];

  const all = entries.filter((e) => e.dts);
  const list = selection === 'all' ? all : [all[Number(selection)]];

  console.log('Generating d.ts files for', list.map((i) => i.file).join(', '));

  await Promise.all(
    list.map(async (i) => {
      await dts(i.file, [...external, ...i.externals], join(__dirname, '..', 'tsconfig.json'));
    })
  );
}

run().catch((e) => {
  process.stderr.write(e.toString());
  process.exit(1);
});

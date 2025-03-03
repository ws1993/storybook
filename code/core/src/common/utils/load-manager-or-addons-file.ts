import { resolve } from 'node:path';

import { logger } from 'storybook/internal/node-logger';

import { dedent } from 'ts-dedent';

import { getInterpretedFile } from './interpret-files';

export function loadManagerOrAddonsFile({ configDir }: { configDir: string }) {
  const storybookCustomAddonsPath = getInterpretedFile(resolve(configDir, 'addons'));
  const storybookCustomManagerPath = getInterpretedFile(resolve(configDir, 'manager'));

  if (storybookCustomAddonsPath || storybookCustomManagerPath) {
    logger.info('=> Loading custom manager config');
  }

  if (storybookCustomAddonsPath && storybookCustomManagerPath) {
    throw new Error(dedent`
      You have both a "addons.js" and a "manager.js", remove the "addons.js" file from your configDir (${resolve(
        configDir,
        'addons'
      )})`);
  }

  return storybookCustomManagerPath || storybookCustomAddonsPath;
}

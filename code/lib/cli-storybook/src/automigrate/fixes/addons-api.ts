import picocolors from 'picocolors';
import { dedent } from 'ts-dedent';

import type { Fix } from '../types';

interface AddonsAPIRunOptions {
  usesAddonsAPI: boolean;
}

export const addonsAPI: Fix<AddonsAPIRunOptions> = {
  id: 'addons-api',

  versionRange: ['*', '*'],

  promptType: 'notification',

  async check({ packageManager }) {
    const allDependencies = await packageManager.getAllDependencies();
    const usesAddonsAPI = !!allDependencies['@storybook/addons'];

    if (!usesAddonsAPI) {
      return null;
    }

    return { usesAddonsAPI: true };
  },

  prompt() {
    return dedent`
      ${picocolors.bold(
        'Attention'
      )}: We've detected that you're using the following package which is removed in Storybook 8 and beyond:

      - ${picocolors.cyan(`@storybook/addons`)}
      
      This package has been deprecated and replaced with ${picocolors.cyan(
        `storybook/internal/preview-api`
      )} and ${picocolors.cyan(`storybook/internal/manager-api`)}.

      You can find more information about the new addons API in the migration guide:
      ${picocolors.yellow(
        'https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#new-addons-api'
      )}
    `;
  },
};

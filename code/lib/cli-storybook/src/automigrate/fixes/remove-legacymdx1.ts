import { writeConfig } from 'storybook/internal/csf-tools';

import { dedent } from 'ts-dedent';

import { updateMainConfig } from '../helpers/mainConfigFile';
import type { Fix } from '../types';

const logger = console;

interface RemoveLegacyMDX1Options {
  hasFeature: boolean;
}

/**
 * Does the user have 'legacyMdx1' in their main.ts?
 *
 * If so, prompt them to upgrade to delete it.
 */
export const removeLegacyMDX1: Fix<RemoveLegacyMDX1Options> = {
  id: 'remove-legacy-mdx1',
  versionRange: ['<8.0.0-alpha.0', '>=8.0.0-alpha.0'],

  async check({ mainConfig }) {
    if (mainConfig.features && Object.hasOwn(mainConfig.features, 'legacyMdx1')) {
      //
      return {
        hasFeature: true,
      };
    }

    return null;
  },

  // TODO: This is a temporary fix to prevent a 500 error when running the migration and the user clicks the link in the prompt to preview the docs. We'll probably need to account for future releases.
  prompt({}) {
    return dedent`
      You have features.legacyMdx1 in your Storybook main config file. This feature has been removed. Shall we remove it from your Storybook main config file?

      Link: https://storybook.js.org/docs/8.0/migration-guide
    `;
  },

  async run({ dryRun, mainConfigPath, skipInstall, packageManager }) {
    logger.info(`✅ Removing legacyMdx1 feature`);
    if (!dryRun) {
      await updateMainConfig({ dryRun: !!dryRun, mainConfigPath }, async (main) => {
        main.removeField(['features', 'legacyMdx1']);
        await writeConfig(main);
      });

      const packageJson = await packageManager.retrievePackageJson();

      await packageManager.removeDependencies({ skipInstall: skipInstall, packageJson }, [
        '@storybook/mdx1-csf',
      ]);
    }
  },
};

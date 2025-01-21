import prompts from 'prompts';

import { runCodemod } from '../automigrate/codemod';
import { getFrameworkPackageName } from '../automigrate/helpers/mainConfigFile';
import type { CommandFix } from '../automigrate/types';
import { configToCsfFactory } from './helpers/config-to-csf-factory';
import { syncStorybookAddons } from './helpers/csf-factories-utils';
import { storyToCsfFactory } from './helpers/story-to-csf-factory';

export const logger = console;

async function runStoriesCodemod(dryRun: boolean | undefined) {
  try {
    let globString = 'src/stories/*.stories.*';
    if (!process.env.IN_STORYBOOK_SANDBOX) {
      logger.log('Please enter the glob for your stories to migrate');
      globString = (
        await prompts({
          type: 'text',
          name: 'glob',
          message: 'glob',
          initial: globString,
        })
      ).glob;
    }
    await runCodemod(globString, storyToCsfFactory, { dryRun });
  } catch (err: any) {
    console.log('err message', err.message);
    if (err.message === 'No files matched') {
      console.log('going to run again');
      await runStoriesCodemod(dryRun);
    } else {
      throw err;
    }
  }
}

export const csfFactories: CommandFix = {
  id: 'csf-factories',
  promptType: 'command',
  async run({
    dryRun,
    mainConfig,
    mainConfigPath,
    previewConfigPath,
    packageJson,
    packageManager,
  }) {
    logger.log(`Adding imports map in ${packageManager.packageJsonPath()}`);
    packageJson.imports = {
      ...packageJson.imports,
      // @ts-expect-error we need to upgrade type-fest
      '#*': ['./*', './*.ts', './*.tsx', './*.js', './*.jsx'],
    };
    await packageManager.writePackageJson(packageJson);

    logger.log('Applying codemod on your stories...');
    await runStoriesCodemod(dryRun);

    logger.log('Applying codemod on your main config...');
    const frameworkPackage =
      getFrameworkPackageName(mainConfig) || '@storybook/your-framework-here';
    await runCodemod(mainConfigPath, (fileInfo) =>
      configToCsfFactory(fileInfo, { configType: 'main', frameworkPackage }, { dryRun })
    );

    logger.log('Applying codemod on your preview config...');
    await runCodemod(previewConfigPath, (fileInfo) =>
      configToCsfFactory(fileInfo, { configType: 'preview', frameworkPackage }, { dryRun })
    );

    logger.log('Synchronizing addons between main and preview config...');
    await syncStorybookAddons(mainConfig, previewConfigPath!);
  },
};

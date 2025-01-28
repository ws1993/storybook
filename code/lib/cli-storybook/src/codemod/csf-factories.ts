import { type JsPackageManager, syncStorybookAddons } from 'storybook/internal/common';

import prompts from 'prompts';

import { runCodemod } from '../automigrate/codemod';
import { getFrameworkPackageName } from '../automigrate/helpers/mainConfigFile';
import type { CommandFix } from '../automigrate/types';
import { configToCsfFactory } from './helpers/config-to-csf-factory';
import { storyToCsfFactory } from './helpers/story-to-csf-factory';

export const logger = console;

async function runStoriesCodemod(options: {
  dryRun: boolean | undefined;
  packageManager: JsPackageManager;
}) {
  const { dryRun, packageManager } = options;
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

    logger.log('Applying codemod on your stories, this might take some time...');

    // TODO: Move the csf-2-to-3 codemod into automigrations
    await packageManager.executeCommand({
      command: `${packageManager.getRemoteRunCommand()} storybook migrate csf-2-to-3 --glob=${globString}`,
      args: [],
      stdio: 'ignore',
      ignoreError: true,
    });

    await runCodemod(globString, storyToCsfFactory, { dryRun });
  } catch (err: any) {
    console.log('err message', err.message);
    if (err.message === 'No files matched') {
      console.log('going to run again');
      await runStoriesCodemod(options);
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

    await runStoriesCodemod({ dryRun, packageManager });

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

    await syncStorybookAddons(mainConfig, previewConfigPath!);
  },
};

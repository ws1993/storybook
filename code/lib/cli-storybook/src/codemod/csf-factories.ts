import { type JsPackageManager, syncStorybookAddons } from 'storybook/internal/common';

import prompts from 'prompts';
import { dedent } from 'ts-dedent';

import { runCodemod } from '../automigrate/codemod';
import { getFrameworkPackageName } from '../automigrate/helpers/mainConfigFile';
import type { CommandFix } from '../automigrate/types';
import { configToCsfFactory } from './helpers/config-to-csf-factory';
import { storyToCsfFactory } from './helpers/story-to-csf-factory';

export const logger = console;

async function runStoriesCodemod(options: {
  dryRun: boolean | undefined;
  packageManager: JsPackageManager;
  useImportsMap: boolean;
  previewConfigPath: string;
}) {
  const { dryRun, packageManager, ...codemodOptions } = options;
  try {
    let globString = 'src/**/*.stories.*';
    if (!process.env.IN_STORYBOOK_SANDBOX) {
      logger.log('Please enter the glob for your stories to migrate');
      globString = (
        await prompts(
          {
            type: 'text',
            name: 'glob',
            message: 'glob',
            initial: globString,
          },
          {
            onCancel: () => process.exit(0),
          }
        )
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

    await runCodemod(globString, (info) => storyToCsfFactory(info, codemodOptions), {
      dryRun,
    });
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
    // prompt whether the user wants to use imports map
    logger.log(
      dedent`The CSF factories format relies on having an import map in your package.json so that it's more convenient to import the preview config in your stories.
      
      Here's how it looks like:
      - imports map: \`import preview from '#.storybook/preview'\`
      - relative map: \`import preview from '../../.storybook/preview'\`
      `
    );
    const { useImportsMap } = await prompts(
      {
        type: 'select',
        name: 'useImportsMap',
        message: 'Which would you like to use?',
        choices: [
          { title: 'Imports map', value: true },
          { title: 'Relative imports', value: false },
        ],
        initial: 0,
      },
      {
        onCancel: () => process.exit(0),
      }
    );

    if (useImportsMap) {
      logger.log(`Adding imports map in ${packageManager.packageJsonPath()}`);
      packageJson.imports = {
        ...packageJson.imports,
        // @ts-expect-error we need to upgrade type-fest
        '#*': ['./*', './*.ts', './*.tsx', './*.js', './*.jsx'],
      };
      await packageManager.writePackageJson(packageJson);
    }

    await runStoriesCodemod({
      dryRun,
      packageManager,
      useImportsMap,
      previewConfigPath: previewConfigPath!,
    });

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

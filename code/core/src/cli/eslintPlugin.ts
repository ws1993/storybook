import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

import type { JsPackageManager } from 'storybook/internal/common';
import { paddedLog } from 'storybook/internal/common';
import { readConfig, writeConfig } from 'storybook/internal/csf-tools';

import detectIndent from 'detect-indent';
import picocolors from 'picocolors';
import prompts from 'prompts';
import { dedent } from 'ts-dedent';

export const SUPPORTED_ESLINT_EXTENSIONS = ['js', 'cjs', 'json'];
const UNSUPPORTED_ESLINT_EXTENSIONS = ['yaml', 'yml'];

export const findEslintFile = () => {
  const filePrefix = '.eslintrc';
  const unsupportedExtension = UNSUPPORTED_ESLINT_EXTENSIONS.find((ext: string) =>
    existsSync(`${filePrefix}.${ext}`)
  );

  if (unsupportedExtension) {
    throw new Error(unsupportedExtension);
  }

  const extension = SUPPORTED_ESLINT_EXTENSIONS.find((ext: string) =>
    existsSync(`${filePrefix}.${ext}`)
  );
  return extension ? `${filePrefix}.${extension}` : null;
};

export async function extractEslintInfo(packageManager: JsPackageManager): Promise<{
  hasEslint: boolean;
  isStorybookPluginInstalled: boolean;
  eslintConfigFile: string | null;
}> {
  const allDependencies = await packageManager.getAllDependencies();
  const packageJson = await packageManager.retrievePackageJson();
  let eslintConfigFile: string | null = null;

  try {
    eslintConfigFile = findEslintFile();
  } catch (err) {
    //
  }

  const isStorybookPluginInstalled = !!allDependencies['eslint-plugin-storybook'];
  const hasEslint = allDependencies.eslint || eslintConfigFile || packageJson.eslintConfig;
  return { hasEslint, isStorybookPluginInstalled, eslintConfigFile };
}

export const normalizeExtends = (existingExtends: any): string[] => {
  if (!existingExtends) {
    return [];
  }

  if (typeof existingExtends === 'string') {
    return [existingExtends];
  }

  if (Array.isArray(existingExtends)) {
    return existingExtends;
  }
  throw new Error(`Invalid eslint extends ${existingExtends}`);
};

export async function configureEslintPlugin(
  eslintFile: string | undefined,
  packageManager: JsPackageManager
) {
  if (eslintFile) {
    paddedLog(`Configuring Storybook ESLint plugin at ${eslintFile}`);
    if (eslintFile.endsWith('json')) {
      const eslintConfig = JSON.parse(await readFile(eslintFile, { encoding: 'utf8' })) as {
        extends?: string[];
      };
      const existingExtends = normalizeExtends(eslintConfig.extends).filter(Boolean);
      eslintConfig.extends = [...existingExtends, 'plugin:storybook/recommended'] as string[];

      const eslintFileContents = await readFile(eslintFile, { encoding: 'utf8' });
      const spaces = detectIndent(eslintFileContents).amount || 2;
      await writeFile(eslintFile, JSON.stringify(eslintConfig, undefined, spaces));
    } else {
      const eslint = await readConfig(eslintFile);
      const existingExtends = normalizeExtends(eslint.getFieldValue(['extends'])).filter(Boolean);
      eslint.setFieldValue(['extends'], [...existingExtends, 'plugin:storybook/recommended']);

      await writeConfig(eslint);
    }
  } else {
    paddedLog(`Configuring eslint-plugin-storybook in your package.json`);
    const packageJson = await packageManager.retrievePackageJson();
    const existingExtends = normalizeExtends(packageJson.eslintConfig?.extends).filter(Boolean);

    await packageManager.writePackageJson({
      ...packageJson,
      eslintConfig: {
        ...packageJson.eslintConfig,
        extends: [...existingExtends, 'plugin:storybook/recommended'],
      },
    });
  }
}

export const suggestESLintPlugin = async (): Promise<boolean> => {
  const { shouldInstall } = await prompts({
    type: 'confirm',
    name: 'shouldInstall',
    message: dedent`
        We have detected that you're using ESLint. Storybook provides a plugin that gives the best experience with Storybook and helps follow best practices: ${picocolors.yellow(
          'https://github.com/storybookjs/eslint-plugin-storybook#readme'
        )}

        Would you like to install it?
      `,
    initial: true,
  });

  return shouldInstall;
};

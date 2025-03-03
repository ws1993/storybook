import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { detectLanguage } from '../../../../../core/src/cli/detect';
import { cliStoriesTargetPath } from '../../../../../core/src/cli/helpers';
import { SupportedLanguage } from '../../../../../core/src/cli/project_types';
import { baseGenerator } from '../baseGenerator';
import type { Generator } from '../types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  // Add prop-types dependency if not using TypeScript
  const language = await detectLanguage(packageManager as any);
  const extraPackages = ['vite', 'react-native-web'];
  if (language === SupportedLanguage.JAVASCRIPT) {
    extraPackages.push('prop-types');
  }

  await baseGenerator(
    packageManager,
    npmOptions,
    options,
    'react',
    {
      extraPackages,
      extraAddons: [`@storybook/addon-onboarding`],
    },
    'react-native-web-vite'
  );

  // Remove CSS files automatically copeied by baseGenerator
  const targetPath = await cliStoriesTargetPath();
  const cssFiles = (await readdir(targetPath)).filter((f) => f.endsWith('.css'));
  await Promise.all(cssFiles.map((f) => rm(join(targetPath, f))));
};

export default generator;

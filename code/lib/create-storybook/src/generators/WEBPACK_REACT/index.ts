import { CoreBuilder } from '../../../../../core/src/cli/project_types';
import { baseGenerator } from '../baseGenerator';
import type { Generator } from '../types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  await baseGenerator(packageManager, npmOptions, options, 'react', {
    extraAddons: [`@storybook/addon-onboarding`],
    webpackCompiler: ({ builder }) => (builder === CoreBuilder.Webpack5 ? 'swc' : undefined),
  });
};

export default generator;

// https://storybook.js.org/docs/react/addons/writing-presets
import path from 'node:path';

import type { PresetProperty } from 'storybook/internal/types';

import type { StorybookConfigVite } from '@storybook/builder-vite';
import { viteFinal as reactViteFinal } from '@storybook/react-vite/preset';

import { dirname, join } from 'path';
import vitePluginStorybookNextjs from 'vite-plugin-storybook-nextjs';

import type { FrameworkOptions } from './types';

export const core: PresetProperty<'core'> = async (config, options) => {
  const framework = await options.presets.apply('framework');

  return {
    ...config,
    builder: {
      name: dirname(
        require.resolve(join('@storybook/builder-vite', 'package.json'))
      ) as '@storybook/builder-vite',
      options: {
        ...(typeof framework === 'string' ? {} : framework.options.builder || {}),
      },
    },
    renderer: dirname(require.resolve(join('@storybook/react', 'package.json'))),
  };
};

export const previewAnnotations: PresetProperty<'previewAnnotations'> = (entry = []) => {
  const nextDir = dirname(require.resolve('@storybook/experimental-nextjs-vite/package.json'));
  const result = [...entry, join(nextDir, 'dist/preview.mjs')];
  return result;
};

export const viteFinal: StorybookConfigVite['viteFinal'] = async (config, options) => {
  const reactConfig = await reactViteFinal(config, options);

  const { nextConfigPath } = await options.presets.apply<FrameworkOptions>('frameworkOptions');

  const nextDir = nextConfigPath ? path.dirname(nextConfigPath) : undefined;

  return {
    ...reactConfig,
    plugins: [...(reactConfig?.plugins ?? []), vitePluginStorybookNextjs({ dir: nextDir })],
  };
};

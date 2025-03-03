import { join } from 'node:path';

import { frameworkToRenderer } from 'storybook/internal/cli';
import { frameworkPackages } from 'storybook/internal/common';

import findUp from 'find-up';
import { dedent } from 'ts-dedent';

import { getFrameworkPackageName } from '../helpers/mainConfigFile';
import type { Fix } from '../types';

interface ViteConfigFileRunOptions {
  plugins: string[];
  existed: boolean;
}

export const viteConfigFile = {
  id: 'viteConfigFile',

  versionRange: ['<8.0.0-beta.3', '>=8.0.0-beta.3'],

  promptType: 'notification',

  async check({ mainConfig, packageManager, mainConfigPath }) {
    let isViteConfigFileFound = !!(await findUp(
      ['vite.config.js', 'vite.config.mjs', 'vite.config.cjs', 'vite.config.ts', 'vite.config.mts'],
      { cwd: mainConfigPath ? join(mainConfigPath, '..') : process.cwd() }
    ));

    const rendererToVitePluginMap: Record<string, string> = {
      preact: '@preact/preset-vite',
      qwik: 'vite-plugin-qwik',
      react: '@vitejs/plugin-react',
      solid: 'vite-plugin-solid',
      svelte: '@sveltejs/vite-plugin-svelte',
      sveltekit: '@sveltejs/kit/vite', // might be pointless?
      vue: '@vitejs/plugin-vue',
    };

    const frameworkPackageName = getFrameworkPackageName(mainConfig);
    if (!frameworkPackageName) {
      return null;
    }
    const frameworkName = frameworkPackages[frameworkPackageName];

    if (frameworkName === 'react-native-web-vite') {
      // we don't expect a vite config file for this framework
      return null;
    }

    const isUsingViteBuilder =
      mainConfig.core?.builder === 'vite' ||
      frameworkPackageName?.includes('vite') ||
      frameworkPackageName === 'qwik' ||
      frameworkPackageName === 'solid' ||
      frameworkPackageName === 'sveltekit';

    const rendererName = frameworkToRenderer[frameworkName as keyof typeof frameworkToRenderer];

    if (
      !isViteConfigFileFound &&
      mainConfig.core?.builder &&
      typeof mainConfig.core?.builder !== 'string' &&
      mainConfig.core?.builder.options
    ) {
      isViteConfigFileFound = !!mainConfig.core?.builder.options.viteConfigPath;
    }

    if (!isViteConfigFileFound && isUsingViteBuilder) {
      const plugins = [];

      if (rendererToVitePluginMap[rendererName]) {
        plugins.push(rendererToVitePluginMap[rendererName]);
      }

      return {
        plugins,
        existed: isViteConfigFileFound,
      };
    }

    const plugin = rendererToVitePluginMap[rendererName];

    if (!plugin) {
      return null;
    }

    const pluginVersion = await packageManager.getPackageVersion(plugin);

    if (isViteConfigFileFound && isUsingViteBuilder && !pluginVersion) {
      const plugins = [];

      if (plugin) {
        plugins.push(plugin);
      }

      return {
        plugins,
        existed: !isViteConfigFileFound,
      };
    }

    return null;
  },

  // TODO: This is a temporary fix to prevent a 500 error when running the migration and the user clicks the link in the prompt to preview the docs. We'll probably need to account for future releases.
  prompt({ existed, plugins }) {
    if (existed) {
      return dedent`
        Since version 8.0.0, Storybook no longer ships with an in-built Vite config.
        We've detected you do have a Vite config, but you may be missing the following plugins in it.

        ${plugins.map((plugin) => `  - ${plugin}`).join('\n')}

        If you already have these plugins, you can ignore this message.

        You can find more information on how to do this here:
        https://storybook.js.org/docs/8.0/migration-guide#missing-viteconfigjs-file

        This change was necessary to support newer versions of Vite.
      `;
    }
    return dedent`
      Since version 8.0.0, Storybook no longer ships with an in-built Vite config.
      Please add a vite.config.js file to your project root.

      You can find more information on how to do this here:
      https://storybook.js.org/docs/8.0/migration-guide#missing-viteconfigjs-file

      This change was necessary to support newer versions of Vite.
    `;
  },
} satisfies Fix<ViteConfigFileRunOptions>;

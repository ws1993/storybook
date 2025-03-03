import { dirname } from 'node:path';

import type { PluginItem } from '@babel/core';

const isLoadIntentTest = process.env.NODE_ENV === 'test';
const isLoadIntentDevelopment = process.env.NODE_ENV === 'development';

type StyledJsxPlugin = [string, any] | string;
type StyledJsxBabelOptions =
  | {
      plugins?: StyledJsxPlugin[];
      styleModule?: string;
      'babel-test'?: boolean;
    }
  | undefined;

// Resolve styled-jsx plugins
function styledJsxOptions(options: StyledJsxBabelOptions) {
  options = options || {};
  options.styleModule = 'styled-jsx/style';

  if (!Array.isArray(options.plugins)) {
    return options;
  }

  options.plugins = options.plugins.map((plugin: StyledJsxPlugin): StyledJsxPlugin => {
    if (Array.isArray(plugin)) {
      const [name, pluginOptions] = plugin;
      return [require.resolve(name), pluginOptions];
    }

    return require.resolve(plugin);
  });

  return options;
}

type NextBabelPresetOptions = {
  'preset-env'?: any;
  'preset-react'?: any;
  'class-properties'?: any;
  'transform-runtime'?: any;
  'styled-jsx'?: StyledJsxBabelOptions;
  'preset-typescript'?: any;
};

type BabelPreset = {
  presets?: PluginItem[] | null;
  plugins?: PluginItem[] | null;
  sourceType?: 'script' | 'module' | 'unambiguous';
  overrides?: Array<{ test: RegExp } & Omit<BabelPreset, 'overrides'>>;
};

// Taken from https://github.com/babel/babel/commit/d60c5e1736543a6eac4b549553e107a9ba967051#diff-b4beead8ad9195361b4537601cc22532R158
function supportsStaticESM(caller: any): boolean {
  return !!caller?.supportsStaticESM;
}

export default (api: any, options: NextBabelPresetOptions = {}): BabelPreset => {
  const supportsESM = api.caller(supportsStaticESM);
  const isServer = api.caller((caller: any) => !!caller && caller.isServer);
  const isCallerDevelopment = api.caller((caller: any) => caller?.isDev);

  // Look at external intent if used without a caller (e.g. via Jest):
  const isTest = isCallerDevelopment == null && isLoadIntentTest;

  // Look at external intent if used without a caller (e.g. Storybook):
  const isDevelopment =
    isCallerDevelopment === true || (isCallerDevelopment == null && isLoadIntentDevelopment);

  const isBabelLoader = api.caller(
    (caller: any) =>
      !!caller && (caller.name === 'babel-loader' || caller.name === 'next-babel-turbo-loader')
  );

  const useJsxRuntime =
    options['preset-react']?.runtime === 'automatic' ||
    (Boolean(api.caller((caller: any) => !!caller && caller.hasJsxRuntime)) &&
      options['preset-react']?.runtime !== 'classic');

  const presetEnvConfig = {
    // In the test environment `modules` is often needed to be set to true, babel figures that out by itself using the `'auto'` option
    // In production/development this option is set to `false` so that webpack can handle import/export with tree-shaking
    modules: 'auto',
    exclude: ['transform-typeof-symbol'],
    bugfixes: true,
    targets: {
      chrome: 100,
      safari: 15,
      firefox: 91,
    },
    ...options['preset-env'],
  };

  // When transpiling for the server or tests, target the current Node version
  // if not explicitly specified:
  if (
    (isServer || isTest) &&
    (!presetEnvConfig.targets ||
      !(typeof presetEnvConfig.targets === 'object' && 'node' in presetEnvConfig.targets))
  ) {
    presetEnvConfig.targets = {
      // Targets the current process' version of Node. This requires apps be
      // built and deployed on the same version of Node.
      // This is the same as using "current" but explicit
      node: process.versions.node,
    };
  }

  return {
    sourceType: 'unambiguous',
    presets: [
      [require('@babel/preset-env'), presetEnvConfig],
      [
        require('@babel/preset-react'),
        {
          // This adds @babel/plugin-transform-react-jsx-source and
          // @babel/plugin-transform-react-jsx-self automatically in development
          development: isDevelopment || isTest,
          ...(useJsxRuntime ? { runtime: 'automatic' } : { pragma: '__jsx' }),
          ...options['preset-react'],
        },
      ],
      [
        require('@babel/preset-typescript'),
        { allowNamespaces: true, ...options['preset-typescript'] },
      ],
    ],
    plugins: [
      isDevelopment && require.resolve('react-refresh/babel'),
      !useJsxRuntime && [
        require('./plugins/jsx-pragma'),
        {
          // This produces the following injected import for modules containing JSX:
          //   import React from 'react';
          //   var __jsx = React.createElement;
          module: 'react',
          importAs: 'React',
          pragma: '__jsx',
          property: 'createElement',
        },
      ],
      [
        require('./plugins/optimize-hook-destructuring'),
        {
          // only optimize hook functions imported from React/Preact
          lib: true,
        },
      ],
      require('@babel/plugin-syntax-dynamic-import'),
      require('@babel/plugin-syntax-import-assertions'),
      require('./plugins/react-loadable-plugin'),
      [require('@babel/plugin-transform-class-properties'), options['class-properties'] || {}],
      [
        require('@babel/plugin-transform-object-rest-spread'),
        {
          useBuiltIns: true,
        },
      ],
      !isServer && [
        require('@babel/plugin-transform-runtime'),
        {
          corejs: false,
          helpers: true,
          regenerator: true,
          useESModules: supportsESM && presetEnvConfig.modules !== 'commonjs',
          absoluteRuntime: isBabelLoader
            ? dirname(require.resolve('@babel/runtime/package.json'))
            : undefined,
          ...options['transform-runtime'],
        },
      ],
      [
        isTest && options['styled-jsx'] && options['styled-jsx']['babel-test']
          ? require('styled-jsx/babel-test')
          : require('styled-jsx/babel'),
        styledJsxOptions(options['styled-jsx']),
      ],
      require('./plugins/amp-attributes'),
      isServer && require('@babel/plugin-syntax-bigint'),
      // Always compile numeric separator because the resulting number is
      // smaller.
      require('@babel/plugin-transform-numeric-separator'),
      require('@babel/plugin-transform-export-namespace-from'),
    ].filter(Boolean),
  };
};

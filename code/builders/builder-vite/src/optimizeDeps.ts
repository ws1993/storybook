import { relative } from 'node:path';

import type { Options } from 'storybook/internal/types';

import type { UserConfig, InlineConfig as ViteInlineConfig } from 'vite';

import { listStories } from './list-stories';

// It ensures that vite converts cjs deps into esm without vite having to find them during startup and then having to log a message about them and restart
// TODO: Many of the deps might be prebundled now though, so probably worth trying to remove and see what happens
const INCLUDE_CANDIDATES = [
  '@base2/pretty-print-object',
  '@emotion/core',
  '@emotion/is-prop-valid',
  '@emotion/styled',
  '@storybook/addon-a11y/preview',
  '@storybook/addon-backgrounds/preview',
  '@storybook/addon-designs/blocks',
  '@storybook/addon-docs/preview',
  '@storybook/addon-essentials/actions/preview',
  '@storybook/addon-essentials/actions/preview',
  '@storybook/addon-essentials/backgrounds/preview',
  '@storybook/addon-essentials/docs/preview',
  '@storybook/addon-essentials/highlight/preview',
  '@storybook/addon-essentials/measure/preview',
  '@storybook/addon-essentials/outline/preview',
  '@storybook/addon-essentials/viewport/preview',
  '@storybook/addon-highlight/preview',
  '@storybook/addon-interactions/preview',
  '@storybook/addon-links/preview',
  '@storybook/addon-measure/preview',
  '@storybook/addon-outline/preview',
  '@storybook/addon-themes',
  '@storybook/addon-themes/preview',
  '@storybook/addon-viewport',
  '@storybook/addon-viewport/preview',
  '@storybook/blocks',
  '@storybook/addon-test/preview',
  '@storybook/experimental-nextjs-vite/dist/preview.mjs',
  '@storybook/html',
  '@storybook/html/dist/entry-preview-docs.mjs',
  '@storybook/html/dist/entry-preview.mjs',
  '@storybook/preact',
  '@storybook/preact/dist/entry-preview-docs.mjs',
  '@storybook/preact/dist/entry-preview.mjs',
  '@storybook/react > acorn-jsx',
  '@storybook/react',
  '@storybook/react/dist/entry-preview-docs.mjs',
  '@storybook/react/dist/entry-preview-rsc.mjs',
  '@storybook/react/dist/entry-preview.mjs',
  '@storybook/svelte',
  '@storybook/svelte/dist/entry-preview-docs.mjs',
  '@storybook/svelte/dist/entry-preview.mjs',
  '@storybook/vue3',
  '@storybook/vue3/dist/entry-preview-docs.mjs',
  '@storybook/vue3/dist/entry-preview.mjs',
  '@storybook/web-components',
  '@storybook/web-components/dist/entry-preview-docs.mjs',
  '@storybook/web-components/dist/entry-preview.mjs',
  'acorn-jsx',
  'acorn-walk',
  'acorn',
  'airbnb-js-shims',
  'ansi-to-html',
  'axe-core',
  'chromatic/isChromatic',
  'color-convert',
  'deep-object-diff',
  'doctrine',
  'emotion-theming',
  'escodegen',
  'estraverse',
  'fast-deep-equal',
  'html-tags',
  'isobject',
  'jsdoc-type-pratt-parser', // TODO: Remove this once it's converted to ESM: https://github.com/jsdoc-type-pratt-parser/jsdoc-type-pratt-parser/issues/173
  'loader-utils',
  'lodash/camelCase.js',
  'lodash/camelCase',
  'lodash/cloneDeep.js',
  'lodash/cloneDeep',
  'lodash/countBy.js',
  'lodash/countBy',
  'lodash/debounce.js',
  'lodash/debounce',
  'lodash/isEqual.js',
  'lodash/isEqual',
  'lodash/isFunction.js',
  'lodash/isFunction',
  'lodash/isPlainObject.js',
  'lodash/isPlainObject',
  'lodash/isString.js',
  'lodash/isString',
  'lodash/kebabCase.js',
  'lodash/kebabCase',
  'lodash/mapKeys.js',
  'lodash/mapKeys',
  'lodash/mapValues.js',
  'lodash/mapValues',
  'lodash/merge.js',
  'lodash/merge',
  'lodash/mergeWith.js',
  'lodash/mergeWith',
  'lodash/pick.js',
  'lodash/pick',
  'lodash/pickBy.js',
  'lodash/pickBy',
  'lodash/startCase.js',
  'lodash/startCase',
  'lodash/throttle.js',
  'lodash/throttle',
  'lodash/uniq.js',
  'lodash/uniq',
  'lodash/upperFirst.js',
  'lodash/upperFirst',
  'memoizerific',
  'mockdate',
  'msw-storybook-addon',
  'overlayscrollbars',
  'polished',
  'prettier/parser-babel',
  'prettier/parser-flow',
  'prettier/parser-typescript',
  'prop-types',
  'qs',
  'react-dom',
  'react-dom/client',
  'react-dom/test-utils',
  'react-fast-compare',
  'react-is',
  'react-textarea-autosize',
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'refractor/core',
  'refractor/lang/bash.js',
  'refractor/lang/css.js',
  'refractor/lang/graphql.js',
  'refractor/lang/js-extras.js',
  'refractor/lang/json.js',
  'refractor/lang/jsx.js',
  'refractor/lang/markdown.js',
  'refractor/lang/markup.js',
  'refractor/lang/tsx.js',
  'refractor/lang/typescript.js',
  'refractor/lang/yaml.js',
  'regenerator-runtime/runtime.js',
  'semver', // TODO: Remove once https://github.com/npm/node-semver/issues/712 is fixed
  'sb-original/default-loader',
  'sb-original/image-context',
  'slash',
  'store2',
  'storybook/internal/preview/runtime',
  'storybook/internal/csf',
  'synchronous-promise',
  'telejson',
  'ts-dedent',
  'unfetch',
  'util-deprecate',
  'vue',
  'warning',
];

/**
 * Helper function which allows us to `filter` with an async predicate. Uses Promise.all for
 * performance.
 */
const asyncFilter = async (arr: string[], predicate: (val: string) => Promise<boolean>) =>
  Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]));

export async function getOptimizeDeps(config: ViteInlineConfig, options: Options) {
  const extraOptimizeDeps = await options.presets.apply('optimizeViteDeps', []);

  const { root = process.cwd() } = config;
  const { normalizePath, resolveConfig } = await import('vite');
  const absoluteStories = await listStories(options);
  const stories = absoluteStories.map((storyPath) => normalizePath(relative(root, storyPath)));
  // TODO: check if resolveConfig takes a lot of time, possible optimizations here
  const resolvedConfig = await resolveConfig(config, 'serve', 'development');

  // This function converts ids which might include ` > ` to a real path, if it exists on disk.
  // See https://github.com/vitejs/vite/blob/67d164392e8e9081dc3f0338c4b4b8eea6c5f7da/packages/vite/src/node/optimizer/index.ts#L182-L199
  const resolve = resolvedConfig.createResolver({ asSrc: false });
  const include = await asyncFilter(
    Array.from(new Set([...INCLUDE_CANDIDATES, ...extraOptimizeDeps])),
    async (id) => Boolean(await resolve(id))
  );

  const optimizeDeps: UserConfig['optimizeDeps'] = {
    ...config.optimizeDeps,
    // We don't need to resolve the glob since vite supports globs for entries.
    entries: stories,
    // We need Vite to precompile these dependencies, because they contain non-ESM code that would break
    // if we served it directly to the browser.
    include: [...include, ...(config.optimizeDeps?.include || [])],
  };

  return optimizeDeps;
}

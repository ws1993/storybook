import { z } from 'zod';

export const supportedFrameworks = [
  'angular',
  'auto',
  'ember',
  'experimental-nextjs-vite',
  'html-vite',
  'html-webpack5',
  'nextjs',
  'preact-vite',
  'preact-webpack5',
  'react-native-web-vite',
  'react-vite',
  'react-webpack5',
  'server-webpack5',
  'svelte-vite',
  'svelte-webpack5',
  'sveltekit',
  'vue3-vite',
  'vue3-webpack5',
  'web-components-vite',
  'web-components-webpack5',
  'qwik',
  'solid',
  'nuxt',
  'react-rsbuild',
  'vue3-rsbuild',
] as const;

export const modernInputs = z.strictObject({
  featuresDocs: z //
    .boolean()
    .optional()
    .describe('enable/disable docs features')
    .default(true),
  featuresTest: z //
    .boolean()
    .optional()
    .describe('enable/disable testing features')
    .default(true),
  featuresEssentials: z //
    .boolean()
    .optional()
    .describe('add most useful addons')
    .default(true),
  featuresOnboarding: z
    .boolean()
    .optional()
    .describe('get a tutorial when you start storybook for the first time')
    .default(true),
  featuresExamples: z
    .boolean()
    .optional()
    .describe('add some example stories to help you get started')
    .default(true),

  directory: z //
    .string()
    .optional()
    .describe('path where to initialize storybook')
    .default('.'),
  framework: z //
    .enum(supportedFrameworks)
    .optional()
    .describe('which framework')
    .default('auto'),

  install: z //
    .boolean()
    .optional()
    .describe('install dependencies using the package manager')
    .default(true),

  ignoreGitNotClean: z //
    .boolean()
    .optional()
    .describe('ignore git not clean')
    .default(false),
});

import { z } from 'zod';

// TODO: sync this/pull this from core
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
  intents: z //
    .array(z.enum(['dev', 'docs', 'test']))
    .optional()
    .describe('what are you using Storybook for?')
    .default(['dev', 'docs', 'test']),
  features: z //
    .array(z.enum(['onboarding', 'examples', 'essentials']))
    .optional()
    .describe('what are you using Storybook for?')
    .default(['onboarding', 'examples', 'essentials']),

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

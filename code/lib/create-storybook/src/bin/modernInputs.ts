import { z } from 'zod';

// TODO: sync this/pull this from core
export const supportedFrameworks = [
  'angular',
  'auto',
  'ember',
  'html-vite',
  'html-webpack5',
  'nextjs',
  'experimental-nextjs-vite',
  'nuxt',
  'preact-vite',
  'preact-webpack5',
  'qwik',
  'react-native-web-vite',
  'react-rsbuild',
  'react-vite',
  'react-webpack5',
  'server-webpack5',
  'solid',
  'svelte-vite',
  'svelte-webpack5',
  'sveltekit',
  'vue3-rsbuild',
  'vue3-vite',
  'vue3-webpack5',
  'web-components-vite',
  'web-components-webpack5',
] as const;

export const supportedFrameworksMap = {
  'html-vite': 'HTML with Vite',
  'html-webpack5': 'HTML with Webpack 5',
  'preact-vite': 'Preact with Vite',
  'preact-webpack5': 'Preact with Webpack 5',
  'react-native-web-vite': 'React Native Web with Vite',
  'react-rsbuild': 'React with Rsbuild',
  'react-vite': 'React with Vite',
  'react-webpack5': 'React with Webpack 5',
  'server-webpack5': 'Server with Webpack 5',
  'svelte-vite': 'Svelte with Vite',
  'svelte-webpack5': 'Svelte with Webpack 5',
  'vue3-rsbuild': 'Vue 3 with Rsbuild',
  'vue3-vite': 'Vue 3 with Vite',
  'vue3-webpack5': 'Vue 3 with Webpack 5',
  'web-components-vite': 'Web Components with Vite',
  'web-components-webpack5': 'Web Components with Webpack 5',
  angular: 'Angular',
  auto: 'Auto',
  ember: 'Ember',
  nextjs: 'NextJS',
  'experimental-nextjs-vite': 'NextJS with Vite',
  nuxt: 'Nuxt',
  qwik: 'Qwik',
  solid: 'Solid',
  sveltekit: 'SvelteKit',
} satisfies Record<(typeof supportedFrameworks)[number], string>;

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

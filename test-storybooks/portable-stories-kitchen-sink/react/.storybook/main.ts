import type { StorybookConfig } from "@storybook/react-vite";
import { join } from 'path';

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-controls",
    "@storybook/experimental-addon-test",
    //"@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableWhatsNewNotifications: true,
  },
  viteFinal: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'test-alias': join(__dirname, 'aliased.ts'),
      },
    },
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include || []),
        "react-dom/test-utils",
        "@storybook/react/**",
        "@storybook/experimental-addon-test/preview",
      ],
    },
  }),
  previewHead: (head = "") => `${head}
  <style>
    body {
      border: 1px solid red;
    }
  </style>`,
  staticDirs: [{ from: './test-static-dirs', to:'test-static-dirs' }],
};
export default config;

import { defineConfig as commonDefineConfig } from 'storybook/internal/common';

import { StorybookConfig } from '../types';

export function defineMain(config: StorybookConfig) {
  return commonDefineConfig<StorybookConfig>(config);
}

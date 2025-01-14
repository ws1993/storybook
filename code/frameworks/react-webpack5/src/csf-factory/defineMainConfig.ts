import { defineConfig as commonDefineConfig } from 'storybook/internal/common';

import type { StorybookConfig } from '../types';

export function defineConfig(config: StorybookConfig) {
  return commonDefineConfig<StorybookConfig>(config);
}

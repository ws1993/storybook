import type { StorybookConfig } from '@storybook/core/types';

export function defineConfig<TConfig extends StorybookConfig>(config: TConfig): TConfig {
  return config;
}

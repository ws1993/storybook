import type { StorybookConfig } from '../types/modules/core-common';

export function defineConfig<TConfig extends StorybookConfig>(config: TConfig): TConfig {
  return config;
}

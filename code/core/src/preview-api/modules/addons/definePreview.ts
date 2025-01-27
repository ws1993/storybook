import type { AnyRenderer, ProjectAnnotations, Renderer } from '@storybook/core/types';

export function definePreview<R extends Renderer = AnyRenderer>(config: ProjectAnnotations<R>) {
  return config;
}

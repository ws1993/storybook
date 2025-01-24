import type { ProjectAnnotations, Renderer } from '@storybook/types';

export function definePreview<R extends Renderer = Renderer>(config: ProjectAnnotations<R>) {
  return config;
}

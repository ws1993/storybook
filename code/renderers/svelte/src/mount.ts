import type { BaseAnnotations } from 'storybook/internal/types';

import type { StoryContext, SvelteRenderer } from './public-types';

export const mount: BaseAnnotations<SvelteRenderer>['mount'] = (context: StoryContext) => {
  return async (Component, options) => {
    if (Component) {
      context.originalStoryFn = () => ({
        Component,
        props: options && 'props' in options ? options?.props : options,
      });
    }
    await context.renderToCanvas();
    return context.canvas;
  };
};

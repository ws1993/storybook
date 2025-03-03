import { type BaseAnnotations } from 'storybook/internal/types';

import { h } from 'vue';

import { type StoryContext, type VueRenderer } from './public-types';

export const mount: BaseAnnotations<VueRenderer>['mount'] = (context: StoryContext) => {
  return async (Component, options) => {
    if (Component) {
      context.originalStoryFn = () => () => h(Component, options?.props, options?.slots);
    }
    await context.renderToCanvas();
    return context.canvas;
  };
};

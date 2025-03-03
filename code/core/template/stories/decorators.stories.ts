import {
  RESET_STORY_ARGS,
  STORY_ARGS_UPDATED,
  UPDATE_STORY_ARGS,
} from 'storybook/internal/core-events';
import { useEffect } from 'storybook/internal/preview-api';
import type {
  ArgsStoryFn,
  PartialStoryFn,
  PlayFunctionContext,
  StoryContext,
} from 'storybook/internal/types';

import { global as globalThis } from '@storybook/global';
import { expect, within } from '@storybook/test';

export default {
  component: globalThis.Components.Pre,
  parameters: { useProjectDecorator: true },
  decorators: [
    (storyFn: PartialStoryFn, context: StoryContext) =>
      storyFn({ args: { ...context.args, text: `component ${context.args.text}` } }),
  ],
};

export const Inheritance = {
  decorators: [
    (storyFn: PartialStoryFn, context: StoryContext) =>
      storyFn({ args: { ...context.args, text: `story ${context.args.text}` } }),
  ],
  args: {
    text: 'starting',
  },
  play: async ({ canvasElement }: PlayFunctionContext<any>) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('pre').innerText).toEqual('story component project starting');
  },
};

// NOTE this story is currently broken in Chromatic for both Vue2/Vue3
// Issue: https://github.com/storybookjs/storybook/issues/22945
export const Hooks = {
  decorators: [
    // decorator that uses hooks
    (storyFn: PartialStoryFn, context: StoryContext) => {
      useEffect(() => {});
      return storyFn({ args: { ...context.args, text: `story ${context.args.text}` } });
    },
    // conditional decorator, runs before the above
    (storyFn: PartialStoryFn, context: StoryContext) =>
      context.args.condition
        ? storyFn()
        : (context.originalStoryFn as ArgsStoryFn)(context.args, context),
  ],
  args: {
    text: 'text',
    condition: true,
  },
  play: async ({ id, args }: PlayFunctionContext<any>) => {
    const channel = globalThis.__STORYBOOK_ADDONS_CHANNEL__;
    await channel.emit(RESET_STORY_ARGS, { storyId: id });
    await new Promise((resolve) => channel.once(STORY_ARGS_UPDATED, resolve));

    await channel.emit(UPDATE_STORY_ARGS, {
      storyId: id,
      updatedArgs: { condition: false },
    });
    await new Promise((resolve) => channel.once(STORY_ARGS_UPDATED, resolve));
  },
  // this story can't be reliably tested because the args changes results in renderPhases disrupting test runs
  tags: ['!vitest', '!test'],
};

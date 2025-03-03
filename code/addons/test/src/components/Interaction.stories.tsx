import { CallStates } from '@storybook/instrumenter';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { getCalls } from '../mocks';
import { Interaction } from './Interaction';
import SubnavStories from './Subnav.stories';

type Story = StoryObj<typeof Interaction>;

export default {
  title: 'Interaction',
  component: Interaction,
  args: {
    callsById: new Map(getCalls(CallStates.DONE).map((call) => [call.id, call])),
    controls: SubnavStories.args.controls,
    controlStates: SubnavStories.args.controlStates,
  },
} as Meta<typeof Interaction>;

export const Active: Story = {
  args: {
    call: getCalls(CallStates.ACTIVE).slice(-1)[0],
  },
};

export const Waiting: Story = {
  args: {
    call: getCalls(CallStates.WAITING).slice(-1)[0],
  },
};

export const Failed: Story = {
  args: {
    call: getCalls(CallStates.ERROR).slice(-1)[0],
  },
};

export const Done: Story = {
  args: {
    call: getCalls(CallStates.DONE).slice(-1)[0],
  },
};

export const WithParent: Story = {
  args: {
    call: { ...getCalls(CallStates.DONE).slice(-1)[0], ancestors: ['parent-id'] },
  },
};

export const Disabled: Story = {
  args: { ...Done.args, controlStates: { ...SubnavStories.args.controlStates, goto: false } },
};

export const Hovered: Story = {
  ...Done,
  globals: { sb_theme: 'light' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button'));
    await expect(canvas.getByTestId('icon-active')).toBeInTheDocument();
  },
};

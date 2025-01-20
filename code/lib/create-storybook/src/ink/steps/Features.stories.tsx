import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within } from '@storybook/test';

import { fireEvent } from '@storybook/testing-library';

import { xtermDecorator } from '../xtermDecorator';
import { FEATURES } from './Features';

const meta: Meta<typeof FEATURES> = {
  component: FEATURES,
  args: {
    state: {
      directory: '.',
      features: [],
      intents: ['dev', 'docs', 'test'],
      ignoreGitNotClean: false,
      ignoreVersion: false,
      install: undefined,
      framework: 'react-vite',
      step: 'FEATURES',
      version: 'latest',
    },
    dispatch: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [xtermDecorator],
};

type Story = StoryObj<typeof meta>;

export default meta;

export const Empty: Story = {
  args: {
    state: {
      ...meta.args!.state,
      features: [],
    },
  },
};

export const Selecting: Story = {
  args: {
    state: {
      ...meta.args!.state,
      features: [],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement);
    const input = await screen.findByLabelText('Terminal input');

    await userEvent.type(input, ' ');
  },
};

export const Set: Story = {
  args: {
    state: {
      ...meta.args!.state,
      features: ['onboarding', 'examples', 'essentials'],
    },
  },
};

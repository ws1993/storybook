import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { xtermDecorator } from '../xtermDecorator';
import { GIT } from './Git';

const meta: Meta<typeof GIT> = {
  component: GIT,
  args: {
    state: {
      directory: '.',
      features: ['onboarding', 'examples', 'essentials'],
      intents: ['dev', 'docs', 'test'],
      ignoreGitNotClean: undefined,
      ignoreVersion: false,
      install: undefined,
      framework: 'react-vite',
      step: 'GIT',
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

export const Loading: Story = {
  parameters: {
    git: 'loading',
  },
};

export const Clean: Story = {
  parameters: {
    git: 'clean',
  },
};

export const Unclean: Story = {
  parameters: {
    git: 'unclean',
  },
};

export const Ignored: Story = {
  parameters: {
    git: 'unclean',
  },
  state: {
    ...meta.args!.state,
    ignoreGitNotClean: true,
  },
};

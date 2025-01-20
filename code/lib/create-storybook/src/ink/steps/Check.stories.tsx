import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { xtermDecorator } from '../xtermDecorator';
import { CHECK } from './check';

const meta: Meta<typeof CHECK> = {
  component: CHECK,
  args: {
    state: {
      directory: '.',
      features: ['onboarding', 'examples', 'essentials'],
      intents: ['dev', 'docs', 'test'],
      ignoreGitNotClean: false,
      ignoreVersion: false,
      install: undefined,
      framework: 'react-vite',
      step: 'CHECK',
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
    check: { type: 'loading' },
  },
};
export const Compatible: Story = {
  parameters: {
    check: { type: 'compatible' },
  },
};
export const Incompatible: Story = {
  parameters: {
    check: { type: 'incompatible' },
  },
};

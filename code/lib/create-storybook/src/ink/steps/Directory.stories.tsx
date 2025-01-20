import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { xtermDecorator } from '../xtermDecorator';
import { DIRECTORY } from './directory';

const meta: Meta<typeof DIRECTORY> = {
  component: DIRECTORY,
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

export const Absolute: Story = {
  args: {
    state: {
      ...meta.args!.state,
      directory: '/absolute/path/to/directory',
    },
  },
};

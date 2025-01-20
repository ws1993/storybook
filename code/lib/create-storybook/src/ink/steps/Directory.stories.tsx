import type { Meta, StoryObj } from '@storybook/react';
import { fireEvent, fn, userEvent, within } from '@storybook/test';

import type { State } from '.';
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
      directory: '/absolute/path/to/directory',
      features: ['onboarding', 'examples', 'essentials'],
      intents: ['dev', 'docs', 'test'],
      ignoreGitNotClean: false,
      ignoreVersion: false,
      install: undefined,
      framework: 'react-vite',
      step: 'CHECK',
      version: 'latest',
    },
  },
};

export const Default: Story = {
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
  },
};

export const Accepted: Story = {
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
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement);
    const input = await screen.findByLabelText('Terminal input');

    userEvent.type(input, 'y');
  },
};

export const Deny: Story = {
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
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement);
    const input = await screen.findByLabelText('Terminal input');

    userEvent.type(input, 'n');
  },
};

import type { Meta, StoryObj } from '@storybook/react';

import { xtermDecorator } from '../xtermDecorator';
import { Prompt } from './Prompt';

const meta: Meta<typeof Prompt> = {
  component: Prompt,
  args: {
    text: 'Hello, World!',
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [xtermDecorator],
} satisfies Meta<typeof Prompt>;

type Story = StoryObj<typeof meta>;

export default meta;

export const Normal: Story = {};
export const Active: Story = {
  args: {
    active: true,
  },
};

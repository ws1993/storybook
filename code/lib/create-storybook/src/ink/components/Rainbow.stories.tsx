import type { Meta, StoryObj } from '@storybook/react';

import { xtermDecorator } from '../xtermDecorator';
import { Rainbow } from './Rainbow';

const meta: Meta<typeof Rainbow> = {
  component: Rainbow,
  args: {
    text: 'Hello, World!',
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [xtermDecorator],
} satisfies Meta<typeof Rainbow>;

type Story = StoryObj<typeof meta>;

export default meta;

export const Normal: Story = {};
export const Long: Story = {
  args: {
    text: 'Hello, Everyone on the Storybook team!',
  },
};

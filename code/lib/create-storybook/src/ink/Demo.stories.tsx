import type { Meta, StoryObj } from '@storybook/react';

import { Demo } from './Demo';
import { xtermDecorator } from './xtermDecorator';

const meta = {
  globals: {
    sb_theme: 'light',
  },
  parameters: {
    layout: 'centered',
  },
  component: Demo,
  args: {
    name: 'world',
    width: 200,
    height: 40,
  },
  decorators: [xtermDecorator],
} satisfies Meta<typeof Demo>;

type Story = StoryObj<typeof meta>;

export default meta;

export const Small: Story = {};

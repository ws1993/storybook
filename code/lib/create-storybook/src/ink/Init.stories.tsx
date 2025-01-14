import type { Meta, StoryObj } from '@storybook/react';

import { Init } from './Init';
import { xtermDecorator } from './xtermDecorator';

const meta: Meta<typeof Init> = {
  component: Init,
  args: {
    width: 120,
    height: 50,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [xtermDecorator],
};

type Story = StoryObj<typeof meta>;

export default meta;

export const Normal: Story = {};

import type { Meta, StoryObj } from '@storybook/react';

import { xtermDecorator } from '../xtermDecorator';
import { App } from './App';

const meta: Meta<typeof App> = {
  component: App,
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

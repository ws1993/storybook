import type { Meta, StoryObj } from '@storybook/react';

import { xtermDecorator } from '../../xtermDecorator';
import { MultiSelect } from './MultiSelect';

const meta: Meta<typeof MultiSelect> = {
  component: MultiSelect,
  args: {
    options: {
      red: 'Red',
      green: 'Green',
      yellow: 'Yellow',
      blue: 'Blue',
      magenta: 'Magenta',
    },
    selection: [],
    setSelection: () => {},
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [xtermDecorator],
} satisfies Meta<typeof MultiSelect>;

type Story = StoryObj<typeof meta>;

export default meta;

export const Normal: Story = {};

export const Overflow: Story = {
  args: {
    options: {
      red: 'Option 1',
      green: 'Option 2',
      yellow: 'Option 3',
      blue: 'Option 4',
      magenta: 'Option 5',
      cyan: 'Option 6',
      white: 'Option 7',
      black: 'Option 8',
      gray: 'Option 9',
      maroon: 'Option 10',
    },
  },
};

export const Selected: Story = {
  args: {
    selection: ['red', 'green', 'yellow', 'blue', 'magenta'],
  },
};

export const Mixed: Story = {
  args: {
    selection: ['blue', 'yellow', 'magenta'],
  },
};

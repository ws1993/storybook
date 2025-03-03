import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta = {
  title: 'examples/Button with Meta Subtitle in docs.subtitle',
  component: Button,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
  globals: { sb_theme: 'light' },
  parameters: {
    docs: {
      subtitle: 'This subtitle is set in parameters.docs.subtitle',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMetaSubtitleInDocsSubtitle: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

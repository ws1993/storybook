import React from 'react';

import { Link } from 'storybook/internal/components';

import { DocumentIcon } from '@storybook/icons';
import type { Meta, StoryObj } from '@storybook/react';

import { EmptyTabContent } from './EmptyTabContent';

export default {
  title: 'TabContentEmpty',
  component: EmptyTabContent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyTabContent>;

type Story = StoryObj<typeof EmptyTabContent>;

export const OnlyTitle: Story = {
  args: {
    title: 'Nothing found',
  },
};

export const TitleAndDescription: Story = {
  args: {
    title: 'Nothing found',
    description: 'Sorry, there is nothing to display here.',
  },
};

export const TitleAndFooter: Story = {
  args: {
    title: 'Nothing found',
    footer: (
      <Link href="foo" withArrow>
        <DocumentIcon /> See the docs
      </Link>
    ),
  },
};

export const TitleDescriptionAndFooter: Story = {
  args: {
    title: 'Nothing found',
    description: 'Sorry, there is nothing to display here.',
    footer: (
      <Link href="foo" withArrow>
        <DocumentIcon /> See the docs
      </Link>
    ),
  },
};

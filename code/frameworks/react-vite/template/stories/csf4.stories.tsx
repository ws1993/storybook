import React from 'react';

import { config } from '#.storybook/preview';

// eslint-disable-next-line storybook/default-exports
const Button = ({ label }) => <button>{label}</button>;

const meta = config.meta({
  component: Button,
  args: {
    label: 'Hello world!',
  },
});

export const Story = meta.story({});

import React from 'react';

import { config } from '#.storybook/preview';

// eslint-disable-next-line storybook/default-exports
const meta = config.meta({
  component: globalThis.Components.Button,
  args: {
    label: 'Hello world!',
  },
});

export const Story = meta.story({});

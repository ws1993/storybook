import React from 'react';

import { config } from '#.storybook/preview';

const meta = config.meta({
  component: globalThis.Components.Button,
  args: {
    label: 'Hello world!',
  },
});

export const Story = meta.story({});

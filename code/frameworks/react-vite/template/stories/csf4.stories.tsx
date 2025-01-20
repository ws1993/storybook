// @ts-expect-error this will be part of the package.json of the sandbox
import config from '#.storybook/preview';

const meta = config.meta({
  component: globalThis.Components.Button,
  args: {
    label: 'Hello world!',
  },
});

export const Story = meta.story({});

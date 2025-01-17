// @ts-expect-error this is just a mock file
import { config } from '#.storybook/preview';

const meta = config.meta({
  title: 'MyComponent',
  args: {
    initial: 'foo',
  },
});
export const Empty = meta.story({});
export const WithArgs = meta.story({
  args: {
    foo: 'bar',
  },
});

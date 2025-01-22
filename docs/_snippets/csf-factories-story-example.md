```ts filename="src/components/Button/Button.stories.ts|tsx" renderer="react" language="ts"
import preview from '#.storybook/preview';
import { Button } from './Button';

const meta = preview.meta({
  title: 'components/Button',
  component: Button,
});

const Primary = meta.story({
  args: {
    label: 'Button',
  },
});
```

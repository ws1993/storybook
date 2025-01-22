```ts filename=".storybook/main.ts|tsx" renderer="react" language="ts"
// Replace your-framework with the framework you are using (e.g., react-vite, nextjs, experimental-nextjs-vite)
import { defineMain } from '@storybook/your-framework';

export default defineMain({
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/experimental-addon-test'],
});
```

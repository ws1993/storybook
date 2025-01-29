```ts filename=".storybook/preview.ts" renderer="react" language="ts"
// Replace your-framework with the framework you are using (e.g., react-vite, nextjs, experimental-nextjs-vite)
import { definePreview } from '@storybook/your-framework';
import addonTest from '@storybook/experimental-addon-test';

export default definePreview({
  // 👇 Add your addons here
  addons: [addonTest()],
  parameters: {
    // type-safe!
    layout: 'fullscreen',
  },
});
```

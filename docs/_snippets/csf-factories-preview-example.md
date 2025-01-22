```ts filename=".storybook/preview.ts|tsx" renderer="react" language="ts"
// Replace your-framework with the framework you are using (e.g., react-vite, nextjs, experimental-nextjs-vite)
import { definePreview } from '@storybook/your-framework/preview';
import * as addonTestAnnotations from '@storybook/experimental-addon-test/preview';

const preview = definePreview({
  // 👇 Add your addons here
  addons: [addonTestAnnotations],
});

export default preview;
```

```ts filename="MyComponent.stories.ts" renderer="angular" language="ts"
import type { Meta, StoryObj } from '@storybook/angular';

import { MyComponent } from './MyComponent.component';

const meta: Meta<MyComponent> = {
  component: MyComponent,
};

export default meta;
type Story = StoryObj<MyComponent>;

export const NonA11yStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```js filename="MyComponent.stories.js|jsx" renderer="react" language="js"
import { MyComponent } from './MyComponent';

export default {
  component: MyComponent,
};

export const NonA11yStory = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```ts filename="MyComponent.stories.ts|tsx" renderer="react" language="ts-4-9"
import type { Meta, StoryObj } from '@storybook/react';

import { MyComponent } from './MyComponent';

const meta = {
  component: MyComponent,
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NonA11yStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```ts filename="MyComponent.stories.ts|tsx" renderer="react" language="ts"
import type { Meta, StoryObj } from '@storybook/react';

import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const NonA11yStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```svelte filename="MyComponent.stories.svelte" renderer="svelte" language="js" tabTitle="Svelte CSF"
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import MyComponent from './MyComponent.svelte';

  const { Story } = defineMeta({
    component: MyComponent,
  });
</script>

<Story
  name="NonA11yStory"
  globals={{
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  }}
/>
```

```js filename="MyComponent.stories.js" renderer="svelte" language="js" tabTitle="CSF"
import MyComponent from './MyComponent.svelte';

export default {
  component: MyComponent,
};

export const NonA11yStory = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```svelte filename="MyComponent.stories.svelte" renderer="svelte" language="ts-4-9" tabTitle="Svelte CSF"
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import MyComponent from './MyComponent.svelte';

  const { Story } = defineMeta({
    component: MyComponent,
  });
</script>

<Story
  name="NonA11yStory"
  globals={{
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  }}
/>
```

```ts filename="MyComponent.stories.ts" renderer="svelte" language="ts-4-9" tabTitle="CSF"
import type { Meta, StoryObj } from '@storybook/svelte';

import MyComponent from './MyComponent.svelte';

const meta = {
  component: MyComponent,
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NonA11yStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```svelte filename="MyComponent.stories.svelte" renderer="svelte" language="ts" tabTitle="Svelte CSF"
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import MyComponent from './MyComponent.svelte';

  const { Story } = defineMeta({
    component: MyComponent,
  });
</script>

<Story
  name="NonA11yStory"
  globals={{
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  }}
/>
```

```ts filename="MyComponent.stories.ts" renderer="svelte" language="ts" tabTitle="CSF"
import type { Meta, StoryObj } from '@storybook/svelte';

import MyComponent from './MyComponent.svelte';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NonA11yStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```js filename="MyComponent.stories.js" renderer="vue" language="js"
import MyComponent from './MyComponent.vue';

export default {
  component: MyComponent,
};

export const NonA11yStory = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```ts filename="MyComponent.stories.ts" renderer="vue" language="ts-4-9"
import type { Meta, StoryObj } from '@storybook/vue3';

import MyComponent from './MyComponent.vue';

const meta = {
  component: MyComponent,
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NonA11yStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```ts filename="MyComponent.stories.ts" renderer="vue" language="ts"
import type { Meta, StoryObj } from '@storybook/vue3';

import MyComponent from './MyComponent.vue';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const NonA11yStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```js filename="MyComponent.stories.js" renderer="web-components" language="js"
export default {
  component: 'my-component',
};

export const ExampleStory = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

```ts filename="MyComponent.stories.ts" renderer="web-components" language="ts"
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  component: 'my-component',
};

export default meta;
type Story = StoryObj;

export const ExampleStory: Story = {
  globals: {
    a11y: {
      // This option disables all automatic a11y checks on this story
      manual: true,
    },
  },
};
```

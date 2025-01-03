import { test } from 'vitest';

import { Button } from './__test__/Button';
import { defineConfig } from './preview';

test('csf factories', () => {
  const config = defineConfig({
    addons: [
      {
        decorators: [],
      },
    ],
  });

  const meta = config.meta({ component: Button, args: { primary: true } });

  const MyStory = meta.story({
    args: {},
  });
});

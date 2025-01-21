import { expect, test } from 'vitest';

import { Button } from './__test__/Button';
import { definePreview } from './preview';

test('csf factories', () => {
  const config = definePreview({
    addons: [
      {
        decorators: [],
      },
    ],
  });

  const meta = config.meta({ component: Button, args: { primary: true } });

  const MyStory = meta.story({
    args: {
      children: 'Hello world',
    },
  });

  expect(MyStory.annotations.args?.children).toBe('Hello world');
});

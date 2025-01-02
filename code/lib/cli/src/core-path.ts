import { dirname } from 'node:path';

export const corePath = dirname(require.resolve('storybook/package.json'));

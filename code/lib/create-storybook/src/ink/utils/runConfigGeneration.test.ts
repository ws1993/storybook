import { describe, expect, it, test } from 'vitest';

import type { State } from '../steps';
import { createMainFile } from './runConfigGeneration';

describe('createMainFile', () => {
  test('should return a string', () => {
    const state: State = {
      directory: 'foo',
      features: ['typescript', 'essentials'],
      framework: 'react-vite',
      step: 'RUN',
      version: 'latest',
      ignoreGitNotClean: false,
      ignoreVersion: false,
      install: true,
      intents: ['test'],
    };
    const result = createMainFile(state, 'main.ts');
    expect(result).toMatchInlineSnapshot(`
      "
              import type { StorybookConfig } from 'react-vite';

              const config: StorybookConfig = {
                      stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

                      framework: {
                        name: 'react-vite',
                        options: {}
                      },

                      addons: [{
                        name: '@storybook/addon-essentials',
                        options: {
                          docs: false
                        }
                      }, '@storybook/experimental-addon-test']
              };

              export default config;
            "
    `);
  });
});

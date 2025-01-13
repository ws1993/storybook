import React from 'react';

import { debounce } from 'es-toolkit';
import { Box, Text, render } from 'ink';
import type { z } from 'zod';

import type { modernInputs as inputs } from '../bin/modernInputs';
import { Demo } from './Demo';

declare global {
  // eslint-disable-next-line no-var
  var CLI_APP_INSTANCE: ReturnType<typeof render> | undefined;
}

if (globalThis.CLI_APP_INSTANCE) {
  globalThis.CLI_APP_INSTANCE.unmount();
}

export type State = {
  features: {
    docs: z.infer<typeof inputs>['featuresDocs'];
    test: z.infer<typeof inputs>['featuresTest'];
    onboarding: z.infer<typeof inputs>['featuresOnboarding'];
    essentials: z.infer<typeof inputs>['featuresEssentials'];
    examples: z.infer<typeof inputs>['featuresExamples'];
  };
  width: number;
  height: number;
};

export async function run(options: z.infer<typeof inputs>) {
  const state: State = {
    features: {
      docs: options.featuresDocs,
      test: options.featuresTest,
      onboarding: options.featuresOnboarding,
      essentials: options.featuresEssentials,
      examples: options.featuresExamples,
    },
    width: process.stdout.columns || 120,
    height: process.stdout.rows || 40,
  };

  // process.stdout.write('\x1Bc');
  globalThis.CLI_APP_INSTANCE = render(
    <Box>
      <Text>HELLO</Text>
    </Box>
  );

  const { rerender, waitUntilExit } = globalThis.CLI_APP_INSTANCE;

  const update = debounce(
    () => {
      state.width = process.stdout.columns || 120;
      state.height = process.stdout.rows || 40;

      process.stdout.write('\x1Bc');
      rerender(<Demo {...state} />);
    },
    8,
    { edges: ['trailing'] }
  );

  process.stdout.on('resize', () => {
    process.stdout.write('\x1Bc');
    update();
  });

  await waitUntilExit();
}

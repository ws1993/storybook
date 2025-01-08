import React from 'react';

import { debounce } from 'es-toolkit';
import { Box, Text, render } from 'ink';

import { Demo } from './Demo';

declare global {
  // eslint-disable-next-line no-var
  var CLI_APP_INSTANCE: ReturnType<typeof render> | undefined;
}

if (globalThis.CLI_APP_INSTANCE) {
  globalThis.CLI_APP_INSTANCE.unmount();
}

interface Options {
  name?: string[];
}

export async function run(options: Options) {
  const state = {
    name: options.name || 'stranger',
    width: process.stdout.columns || 120,
    height: process.stdout.rows || 40,
  };

  process.stdout.write('\x1Bc');
  globalThis.CLI_APP_INSTANCE = render(
    <Box>
      <Text>
        {state.name} - {state.width} x {state.height}
      </Text>
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

import React from 'react';

import { debounce } from 'es-toolkit';
import { render } from 'ink';
import meow from 'meow';

import { clearScreen, enterAltScreen, leaveAltScreen } from './commands';
import { App } from './components/App';
import { Output } from './components/Output';

declare global {
  let CLI_APP_INSTANCE: ReturnType<typeof render> | undefined;
}

const cli = meow({
  importMeta: import.meta,
  inferType: true,
  autoHelp: true,

  flags: {
    name: {
      type: 'string',
      isMultiple: true,
    },
  },
});

if (globalThis.CLI_APP_INSTANCE) {
  globalThis.CLI_APP_INSTANCE.unmount();
}

const state = {
  name: cli.flags.name?.[0],
  width: process.stdout.columns || 120,
  height: process.stdout.rows || 40,
};

const logQueue: string[] = [];

console.debug = function (message: string) {
  logQueue.push(message);
};

process.on('exit', () => {
  leaveAltScreen();
  console.log(logQueue.join('\n'));
  render(<Output logQueue={logQueue} />);
});

(async function main() {
  enterAltScreen();
  globalThis.CLI_APP_INSTANCE = render(<App {...state} />);

  const { rerender, waitUntilExit } = globalThis.CLI_APP_INSTANCE;

  const update = debounce(
    () => {
      state.width = process.stdout.columns || 120;
      state.height = process.stdout.rows || 40;
      clearScreen();
      rerender(<App {...state} />);
    },
    8,
    { edges: ['trailing'] }
  );

  process.stdout.on('resize', () => {
    clearScreen();
    update();
  });

  await waitUntilExit();
})();

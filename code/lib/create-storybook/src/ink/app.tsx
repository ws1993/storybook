import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import process from 'node:process';

import React, { type ComponentProps } from 'react';

import { telemetry } from 'storybook/internal/telemetry';

import { debounce } from 'es-toolkit';
// eslint-disable-next-line depend/ban-dependencies
import glob from 'fast-glob';
import { render } from 'ink';
import type { z } from 'zod';

import type { modernInputs as inputs } from '../bin/modernInputs';
import { Main } from './Main';
import { checkCompatibility } from './steps/Check';
import { checkFramework } from './steps/Framework';
import { checkGitStatus } from './steps/Git';
import { checkExists, downloadSandbox } from './steps/Sandbox';
import { checkVersion } from './steps/Version';
import { AppContext } from './utils/context';

const require = createRequire(import.meta.url);

declare global {
  // eslint-disable-next-line no-var
  var CLI_APP_INSTANCE: ReturnType<typeof render> | undefined;
}

if (globalThis.CLI_APP_INSTANCE) {
  globalThis.CLI_APP_INSTANCE.unmount();
}

export type Input = z.infer<typeof inputs> & {
  width: number;
  height: number;
};

export async function run(options: z.infer<typeof inputs>) {
  const input: Input = {
    ...options,
    intents: ['dev', ...options.intents.filter((v) => v !== 'dev')],
    width: process.stdout.columns || 120,
    height: process.stdout.rows || 40,
  };

  // process.stdout.write('\x1Bc');
  process.stdout.write('\n');
  const context: ComponentProps<typeof AppContext.Provider>['value'] = {
    fs,
    process,
    child_process,
    require,
    telemetry,
    glob,
    checkGitStatus,
    checkCompatibility,
    checkVersion,
    checkFramework,
    checkExists,
    downloadSandbox,
  };
  globalThis.CLI_APP_INSTANCE = render(
    <AppContext.Provider value={context}>
      <Main {...input} />
    </AppContext.Provider>
  );

  const { rerender, waitUntilExit } = globalThis.CLI_APP_INSTANCE;

  const update = debounce(
    () => {
      input.width = process.stdout.columns || 120;
      input.height = process.stdout.rows || 40;

      // process.stdout.write('\x1Bc');
      rerender(
        <AppContext.Provider value={context}>
          <Main {...input} />
        </AppContext.Provider>
      );
    },
    8,
    { edges: ['trailing'] }
  );

  process.stdout.on('resize', () => {
    // process.stdout.write('\x1Bc');
    update();
  });

  const exit = () =>
    telemetry('canceled', { eventType: 'init' }, { stripMetadata: true, immediate: true })
      .then(() => process.exit(0))
      .catch(() => process.exit(1));

  process.on('SIGINT', exit);
  process.on('SIGTERM', exit);

  await waitUntilExit();
}

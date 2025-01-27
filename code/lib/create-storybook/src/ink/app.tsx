import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

import React, { type ComponentProps } from 'react';

import { JsPackageManagerFactory } from 'storybook/internal/common';
import { telemetry } from 'storybook/internal/telemetry';

import { debounce } from 'es-toolkit';
// eslint-disable-next-line depend/ban-dependencies
import glob from 'fast-glob';
import findUp from 'find-up';
import { render } from 'ink';
import type { z } from 'zod';

import type { modernInputs as inputs } from '../bin/modernInputs';
import { Main } from './Main';
import { checkExists, downloadSandbox } from './steps/ExistsResult';
import { checkFramework } from './steps/Framework';
import { checkGitStatus } from './steps/Git';
import { checkVersion } from './steps/Version';
import { AppContext } from './utils/context';
import { runConfigGeneration } from './utils/runConfigGeneration';

const require = createRequire(import.meta.url);

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
    width: process.stdout.columns || 120,
    height: process.stdout.rows || 40,
  };

  // process.stdout.write('\x1Bc');
  process.stdout.write('\n');
  const context: ComponentProps<typeof AppContext.Provider>['value'] = {
    fs,
    path,
    process,
    child_process,
    require,
    telemetry,
    findUp,
    glob,
    checkGitStatus,
    checkVersion,
    checkFramework,
    checkExists,
    downloadSandbox,
    runConfigGeneration,
    JsPackageManagerFactory,
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
    telemetry(
      'canceled',
      { eventType: 'init' },
      { stripMetadata: true, immediate: true, notify: false }
    )
      .then(() => process.exit(0))
      .catch(() => process.exit(1));

  process.on('SIGINT', exit);
  process.on('SIGTERM', exit);

  await waitUntilExit();
}

// eslint-disable-next-line depend/ban-dependencies
import { readFile } from 'fs-extra';
import { resolve } from 'path';

import type { Task } from '../task';
import { exec } from '../utils/exec';
import { maxConcurrentTasks } from '../utils/maxConcurrentTasks';

// The amount of VCPUs for the check task on CI is 4 (large resource)
const amountOfVCPUs = 4;

const parallel = `--parallel=${process.env.CI ? amountOfVCPUs - 1 : maxConcurrentTasks}`;

const linkedContents = `export * from '../../src/manager-api/index.ts';`;
const linkCommand = `npx nx run-many -t build ${parallel}`;
const noLinkCommand = `npx nx run-many -t build -c production ${parallel}`;

export const compile: Task = {
  description: 'Compile the source code of the monorepo',
  dependsOn: ['install'],
  async ready({ codeDir }, { link }) {
    try {
      // To check if the code has been compiled as we need, we check the compiled output of
      // `@storybook/preview`. To check if it has been built for publishing (i.e. `--no-link`),
      // we check if it built types or references source files directly.
      const contents = await readFile(
        resolve(codeDir, './core/dist/manager-api/index.d.ts'),
        'utf8'
      );
      const isLinkedContents = contents.indexOf(linkedContents) !== -1;

      if (link) {
        return isLinkedContents;
      }
      return !isLinkedContents;
    } catch (err) {
      return false;
    }
  },
  async run({ codeDir }, { link, dryRun, debug, prod, skipCache }) {
    const command = link && !prod ? linkCommand : noLinkCommand;
    return exec(
      `${command} ${skipCache ? '--skip-nx-cache' : ''}`,
      { cwd: codeDir },
      {
        startMessage: '🥾 Bootstrapping',
        errorMessage: '❌ Failed to bootstrap',
        dryRun,
        debug,
      }
    );
  },
};

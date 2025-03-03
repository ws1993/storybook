import fs from 'fs';
// eslint-disable-next-line depend/ban-dependencies
import { move, remove } from 'fs-extra';
import { join } from 'path';

import { runCommand } from '../generate';

interface SetupYarnOptions {
  cwd: string;
  pnp?: boolean;
  version?: 'berry' | 'classic';
}

export async function setupYarn({ cwd, pnp = false, version = 'classic' }: SetupYarnOptions) {
  // force yarn
  fs.writeFileSync(join(cwd, 'yarn.lock'), '', { flag: 'a' });
  await runCommand(`yarn set version ${version}`, { cwd });
  if (version === 'berry' && !pnp) {
    await runCommand('yarn config set nodeLinker node-modules', { cwd });
  }
  await remove(join(cwd, 'package.json'));
}

export async function localizeYarnConfigFiles(baseDir: string, beforeDir: string) {
  await Promise.allSettled([
    fs.writeFileSync(join(beforeDir, 'yarn.lock'), '', { flag: 'a' }),
    move(join(baseDir, '.yarn'), join(beforeDir, '.yarn')),
    move(join(baseDir, '.yarnrc.yml'), join(beforeDir, '.yarnrc.yml')),
    move(join(baseDir, '.yarnrc'), join(beforeDir, '.yarnrc')),
  ]);
}

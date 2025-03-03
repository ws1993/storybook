import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import { logger } from 'storybook/internal/node-logger';

import { spawn as spawnAsync, sync as spawnSync } from 'cross-spawn';
import picocolors from 'picocolors';

type ExecOptions = Parameters<typeof spawnAsync>[2];

interface LinkOptions {
  target: string;
  local?: boolean;
  start: boolean;
}

// TODO: Extract this to somewhere else, or use `exec` from a different file that might already have it
export const exec = async (
  command: string,
  options: ExecOptions = {},
  {
    startMessage,
    errorMessage,
    dryRun,
  }: { startMessage?: string; errorMessage?: string; dryRun?: boolean } = {}
) => {
  if (startMessage) {
    logger.info(startMessage);
  }

  if (dryRun) {
    logger.info(`\n> ${command}\n`);
    return undefined;
  }

  logger.info(command);
  return new Promise((resolve, reject) => {
    const child = spawnAsync(command, {
      ...options,
      shell: true,
      stdio: 'pipe',
    });

    child.stderr.pipe(process.stdout);
    child.stdout.pipe(process.stdout);

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        logger.error(picocolors.red(`An error occurred while executing: \`${command}\``));
        if (errorMessage) {
          logger.info(errorMessage);
        }
        reject(new Error(`command exited with code: ${code}: `));
      }
    });
  });
};

export const link = async ({ target, local, start }: LinkOptions) => {
  const storybookDir = process.cwd();
  try {
    const packageJson = JSON.parse(await readFile('package.json', { encoding: 'utf8' }));
    if (packageJson.name !== '@storybook/root') {
      throw new Error();
    }
  } catch {
    throw new Error('Expected to run link from the root of the storybook monorepo');
  }

  let reproDir = target;
  let reproName = basename(target);

  if (!local) {
    const reprosDir = join(storybookDir, '../storybook-repros');
    logger.info(`Ensuring directory ${reprosDir}`);
    // Passing `recursive: true` ensures that the method doesn't throw when
    // the directory already exists.
    await mkdir(reprosDir, { recursive: true });

    logger.info(`Cloning ${target}`);
    await exec(`git clone ${target}`, { cwd: reprosDir });
    // Extract a repro name from url given as input (take the last part of the path and remove the extension)
    reproName = basename(target, extname(target));
    reproDir = join(reprosDir, reproName);
  }

  const version = spawnSync('yarn', ['--version'], {
    cwd: reproDir,
    stdio: 'pipe',
    shell: true,
  }).stdout.toString();

  if (!/^[2-4]\./.test(version)) {
    logger.warn(`🚨 Expected yarn 2 or higher in ${reproDir}!`);
    logger.warn('');
    logger.warn('Please set it up with `yarn set version berry`,');
    logger.warn(`then link '${reproDir}' with the '--local' flag.`);
    return;
  }

  logger.info(`Linking ${reproDir}`);
  await exec(`yarn link --all --relative ${storybookDir}`, { cwd: reproDir });

  logger.info(`Installing ${reproName}`);

  const reproPackageJson = JSON.parse(
    await readFile(join(reproDir, 'package.json'), { encoding: 'utf8' })
  );

  if (!reproPackageJson.devDependencies?.vite) {
    reproPackageJson.devDependencies = {
      ...reproPackageJson.devDependencies,
      'webpack-hot-middleware': '*',
    };
  }

  // ensure that linking is possible
  reproPackageJson.devDependencies = {
    ...reproPackageJson.devDependencies,
    '@types/node': '^22',
  };

  await writeFile(join(reproDir, 'package.json'), JSON.stringify(reproPackageJson, null, 2));

  await exec(`yarn install`, { cwd: reproDir });

  if (start) {
    logger.info(`Running ${reproName} storybook`);
    await exec(`yarn run storybook`, { cwd: reproDir });
  }
};

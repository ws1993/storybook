import { cache } from 'storybook/internal/common';
import { buildDevStandalone, withTelemetry } from 'storybook/internal/core-server';
import { logger, instance as npmLog } from 'storybook/internal/node-logger';
import type { CLIOptions } from 'storybook/internal/types';

import { findPackage } from 'fd-package-json';
import invariant from 'tiny-invariant';
import { dedent } from 'ts-dedent';

function printError(error: any) {
  // this is a weird bugfix, somehow 'node-pre-gyp' is polluting the npmLog header
  npmLog.heading = '';

  if (error instanceof Error) {
    if ((error as any).error) {
      logger.error((error as any).error);
    } else if ((error as any).stats && (error as any).stats.compilation.errors) {
      (error as any).stats.compilation.errors.forEach((e: any) => logger.plain(e));
    } else {
      logger.error(error as any);
    }
  } else if (error.compilation?.errors) {
    error.compilation.errors.forEach((e: any) => logger.plain(e));
  }

  logger.line();
  logger.warn(
    error.close
      ? dedent`
          FATAL broken build!, will close the process,
          Fix the error below and restart storybook.
        `
      : dedent`
          Broken build, fix the error above.
          You may need to refresh the browser.
        `
  );
  logger.line();
}

export const dev = async (cliOptions: CLIOptions) => {
  const { env } = process;
  env.NODE_ENV = env.NODE_ENV || 'development';

  const packageJson = await findPackage(__dirname);
  invariant(packageJson, 'Failed to find the closest package.json file.');
  type Options = Parameters<typeof buildDevStandalone>[0];

  const options = {
    ...cliOptions,
    configDir: cliOptions.configDir || './.storybook',
    configType: 'DEVELOPMENT',
    ignorePreview: !!cliOptions.previewUrl && !cliOptions.forceBuildPreview,
    cache: cache as any,
    packageJson,
  } as Options;

  await withTelemetry(
    'dev',
    {
      cliOptions,
      presetOptions: options as Parameters<typeof withTelemetry>[1]['presetOptions'],
      printError,
    },
    () => buildDevStandalone(options)
  );
};

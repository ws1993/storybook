import { setOutput } from '@actions/core';
import { program } from 'commander';
import picocolors from 'picocolors';
import semver from 'semver';

import { esMain } from '../utils/esmain';
import { getCurrentVersion } from './get-current-version';

program
  .name('is-prerelease')
  .description(
    'returns true if the specified version is a prerelease. If no version argument specified it will use the current version in code/package.json'
  )
  .arguments('[version]')
  .option('-V, --verbose', 'Enable verbose logging', false);

export const isPrerelease = async (args: { version?: string; verbose?: boolean }) => {
  if (args.verbose) {
    if (args.version) {
      console.log(`📦 Checking if version ${picocolors.blue(args.version)} is a prerelease`);
    } else {
      console.log(
        `📦 Checking if current version in ${picocolors.blue('code/package.json')} is a prerelease`
      );
    }
  }
  const version = args.version || (await getCurrentVersion());
  const result = semver.prerelease(version) !== null;

  if (process.env.GITHUB_ACTIONS === 'true') {
    setOutput('prerelease', result);
  }
  console.log(
    `📦 Version ${picocolors.blue(version)} ${
      result ? picocolors.green('IS') : picocolors.red('IS NOT')
    } a prerelease`
  );

  return result;
};

if (esMain(import.meta.url)) {
  const parsed = program.parse();
  isPrerelease({
    version: parsed.args[0],
    verbose: parsed.opts().verbose,
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

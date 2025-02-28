import { getStorybookVersionSpecifier } from 'storybook/internal/cli';
import { versions } from 'storybook/internal/common';

import picocolors from 'picocolors';
import { coerce, major, parse, prerelease } from 'semver';
import { dedent } from 'ts-dedent';

import { createBlocker } from './types';

interface MajorVersionData {
  currentVersion: string;
}

/** Returns true if upgrading should be blocked due to major version gap */
export function shouldBlockUpgrade(currentVersion: string, targetVersion: string): boolean {
  // Skip check for missing versions
  if (!currentVersion || !targetVersion) {
    return false;
  }

  const current = parse(currentVersion);
  const target = parse(targetVersion);
  if (!current || !target) {
    return false;
  }

  // Never block if upgrading from or to a prerelease
  if (prerelease(currentVersion) || prerelease(targetVersion)) {
    return false;
  }

  // Never block if upgrading from or to a canary
  if (current.major === 0 || target.major === 0) {
    return false;
  }

  const gap = target.major - current.major;
  return gap > 1;
}

export const blocker = createBlocker<MajorVersionData>({
  id: 'major-version-gap',
  async check(options) {
    const { packageManager } = options;
    const packageJson = await packageManager.retrievePackageJson();

    try {
      const current = getStorybookVersionSpecifier(packageJson);
      if (!current) {
        return false;
      }

      const target = versions.storybook;
      if (shouldBlockUpgrade(current, target)) {
        return {
          currentVersion: current,
        };
      }
    } catch (e) {
      // If we can't determine the version, don't block
      return false;
    }

    return false;
  },
  log(options, data) {
    const coercedVersion = coerce(data.currentVersion);
    const message = dedent`
      ${picocolors.red('Major Version Gap Detected')}
      Your Storybook version (v${data.currentVersion}) is more than one major version behind the target release (v${versions.storybook}).
      Please upgrade one major version at a time.`;

    if (coercedVersion) {
      const currentMajor = major(coercedVersion);
      const nextMajor = currentMajor + 1;
      const cmd = `npx storybook@${nextMajor} upgrade`;
      return dedent`
        ${message}

        You can upgrade to version ${nextMajor} by running:
        ${picocolors.cyan(cmd)}

        For more information about upgrading, visit:
        ${picocolors.cyan('https://storybook.js.org/docs/react/configure/upgrading')}`;
    }

    return dedent`
      ${message}

      For more information about upgrading, visit:
      ${picocolors.cyan('https://storybook.js.org/docs/react/configure/upgrading')}`;
  },
});

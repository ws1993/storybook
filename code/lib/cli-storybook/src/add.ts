import { isAbsolute, join } from 'node:path';

import {
  JsPackageManagerFactory,
  type PackageManagerName,
  serverRequire,
  syncStorybookAddons,
  versions,
} from 'storybook/internal/common';
import { readConfig, writeConfig } from 'storybook/internal/csf-tools';
import type { StorybookConfigRaw } from 'storybook/internal/types';

import prompts from 'prompts';
import SemVer from 'semver';
import { dedent } from 'ts-dedent';

import {
  getRequireWrapperName,
  wrapValueWithRequireWrapper,
} from './automigrate/fixes/wrap-require-utils';
import { getStorybookData } from './automigrate/helpers/mainConfigFile';
import { postinstallAddon } from './postinstallAddon';

export interface PostinstallOptions {
  packageManager: PackageManagerName;
  configDir: string;
  yes?: boolean;
}

/**
 * Extract the addon name and version specifier from the input string
 *
 * @example
 *
 * ```ts
 * getVersionSpecifier('@storybook/addon-docs@7.0.1') => ['@storybook/addon-docs', '7.0.1']
 * ```
 *
 * @param addon - The input string
 * @returns {undefined} AddonName, versionSpecifier
 */
export const getVersionSpecifier = (addon: string) => {
  const groups = /^(@{0,1}[^@]+)(?:@(.+))?$/.exec(addon);
  if (groups) {
    return [groups[1], groups[2]] as const;
  }
  return [addon, undefined] as const;
};

const requireMain = (configDir: string) => {
  const absoluteConfigDir = isAbsolute(configDir) ? configDir : join(process.cwd(), configDir);
  const mainFile = join(absoluteConfigDir, 'main');

  return serverRequire(mainFile) ?? {};
};

const checkInstalled = (addonName: string, main: StorybookConfigRaw) => {
  const existingAddon = main.addons?.find((entry: string | { name: string }) => {
    const name = typeof entry === 'string' ? entry : entry.name;
    return name?.endsWith(addonName);
  });
  return !!existingAddon;
};

const isCoreAddon = (addonName: string) => Object.hasOwn(versions, addonName);

type CLIOptions = {
  packageManager?: PackageManagerName;
  configDir?: string;
  skipPostinstall: boolean;
  yes?: boolean;
};

/**
 * Install the given addon package and add it to main.js
 *
 * @example
 *
 * ```sh
 * sb add "@storybook/addon-docs"
 * sb add "@storybook/addon-interactions@7.0.1"
 * ```
 *
 * If there is no version specifier and it's a storybook addon, it will try to use the version
 * specifier matching your current Storybook install version.
 */
export async function add(
  addon: string,
  { packageManager: pkgMgr, skipPostinstall, configDir: userSpecifiedConfigDir, yes }: CLIOptions,
  logger = console
) {
  const [addonName, inputVersion] = getVersionSpecifier(addon);

  const packageManager = JsPackageManagerFactory.getPackageManager({ force: pkgMgr });
  const { mainConfig, mainConfigPath, configDir, previewConfigPath, storybookVersion } =
    await getStorybookData({
      packageManager,
      configDir: userSpecifiedConfigDir,
    });

  if (typeof configDir === 'undefined') {
    throw new Error(dedent`
      Unable to find storybook config directory. Please specify your Storybook config directory with the --config-dir flag.
    `);
  }

  if (!mainConfigPath) {
    logger.error('Unable to find Storybook main.js config');
    return;
  }

  let shouldAddToMain = true;
  if (checkInstalled(addonName, mainConfig)) {
    shouldAddToMain = false;
    if (!yes) {
      logger.log(`The Storybook addon "${addonName}" is already present in ${mainConfigPath}.`);
      const { shouldForceInstall } = await prompts({
        type: 'confirm',
        name: 'shouldForceInstall',
        message: `Do you wish to install it again?`,
      });

      if (!shouldForceInstall) {
        return;
      }
    }
  }

  const main = await readConfig(mainConfigPath);
  logger.log(`Verifying ${addonName}`);

  let version = inputVersion;

  if (!version && isCoreAddon(addonName) && storybookVersion) {
    version = storybookVersion;
  }
  if (!version) {
    version = await packageManager.latestVersion(addonName);
  }

  if (isCoreAddon(addonName) && version !== storybookVersion) {
    logger.warn(
      `The version of ${addonName} (${version}) you are installing is not the same as the version of Storybook you are using (${storybookVersion}). This may lead to unexpected behavior.`
    );
  }

  const addonWithVersion =
    isValidVersion(version) && !version.includes('-pr-')
      ? `${addonName}@^${version}`
      : `${addonName}@${version}`;

  logger.log(`Installing ${addonWithVersion}`);
  await packageManager.addDependencies({ installAsDevDependencies: true }, [addonWithVersion]);

  if (shouldAddToMain) {
    logger.log(`Adding '${addon}' to the "addons" field in ${mainConfigPath}`);

    const mainConfigAddons = main.getFieldNode(['addons']);
    if (mainConfigAddons && getRequireWrapperName(main) !== null) {
      const addonNode = main.valueToNode(addonName);
      main.appendNodeToArray(['addons'], addonNode as any);
      wrapValueWithRequireWrapper(main, addonNode as any);
    } else {
      main.appendValueToArray(['addons'], addonName);
    }

    await writeConfig(main);
  }

  // TODO: remove try/catch once CSF factories is shipped, for now gracefully handle any error
  try {
    await syncStorybookAddons(mainConfig, previewConfigPath!);
  } catch (e) {}

  if (!skipPostinstall && isCoreAddon(addonName)) {
    await postinstallAddon(addonName, { packageManager: packageManager.type, configDir, yes });
  }
}
function isValidVersion(version: string) {
  return SemVer.valid(version) || version.match(/^\d+$/);
}

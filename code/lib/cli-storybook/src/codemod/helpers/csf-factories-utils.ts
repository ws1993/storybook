/* eslint-disable no-underscore-dangle */
import { types as t } from 'storybook/internal/babel';
import { type ConfigFile, readConfig, writeConfig } from 'storybook/internal/csf-tools';

import type { StorybookConfigRaw } from '@storybook/types';

import { getAddonNames } from '../../automigrate/helpers/mainConfigFile';
import { logger } from '../csf-factories';
import { getAddonAnnotations } from './get-addon-annotations';

export function cleanupTypeImports(programNode: t.Program, disallowList: string[]) {
  return programNode.body.filter((node) => {
    if (t.isImportDeclaration(node)) {
      const { source, specifiers } = node;

      if (source.value.startsWith('@storybook/')) {
        const allowedSpecifiers = specifiers.filter((specifier) => {
          if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported)) {
            return !disallowList.includes(specifier.imported.name);
          }
          // Retain non-specifier imports (e.g., namespace imports)
          return true;
        });

        // Remove the entire import if no specifiers are left
        if (allowedSpecifiers.length > 0) {
          node.specifiers = allowedSpecifiers;
          return true;
        }

        // Remove the import if no specifiers remain
        return false;
      }
    }

    // Retain all other nodes
    return true;
    // @TODO adding any for now, unsure how to fix the following error:
    // error TS4058: Return type of exported function has or is using name 'BlockStatement' from external module "/code/core/dist/babel/index" but cannot be named
  }) as any;
}

export async function syncStorybookAddons(
  mainConfig: StorybookConfigRaw,
  previewConfigPath: string
) {
  const previewConfig = await readConfig(previewConfigPath!);
  const modifiedConfig = await getSyncedStorybookAddons(mainConfig, previewConfig);

  await writeConfig(modifiedConfig);
}

export async function getSyncedStorybookAddons(
  mainConfig: StorybookConfigRaw,
  previewConfig: ConfigFile
): Promise<ConfigFile> {
  const program = previewConfig._ast.program;
  const isCsfFactoryPreview = !!program.body.find((node) => {
    return (
      t.isImportDeclaration(node) &&
      node.source.value.includes('@storybook') &&
      node.source.value.endsWith('/preview') &&
      node.specifiers.some((specifier) => {
        return (
          t.isImportSpecifier(specifier) &&
          t.isIdentifier(specifier.imported) &&
          specifier.imported.name === 'definePreview'
        );
      })
    );
  });

  if (!isCsfFactoryPreview) {
    logger.log('Skipping syncStorybookAddons as the preview config is not a csf factory');
    return previewConfig;
  }

  const addons = getAddonNames(mainConfig);

  /**
   * This goes through all mainConfig.addons, read their package.json and check whether they have an
   * exports map called preview, if so add to the array
   */
  addons.forEach(async (addon) => {
    const annotations = await getAddonAnnotations(addon);
    if (annotations) {
      previewConfig.setImport({ namespace: annotations.importName }, annotations.importPath);
      const existingAddons = previewConfig.getFieldNode(['addons']);

      if (
        !existingAddons ||
        (t.isArrayExpression(existingAddons) &&
          !existingAddons.elements.some(
            (element) => t.isIdentifier(element) && element.name === annotations.importName
          ))
      ) {
        previewConfig.appendNodeToArray(['addons'], t.identifier(annotations.importName));
      }
    }
  });

  return previewConfig;
}

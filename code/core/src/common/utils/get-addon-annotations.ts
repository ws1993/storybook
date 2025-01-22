import path from 'node:path';

/**
 * Get the name of the annotations object for a given addon.
 *
 * Input: '@storybook/addon-essentials'
 *
 * Output: 'addonEssentialsAnnotations'
 */
export function getAnnotationsName(addonName: string): string {
  // remove @storybook namespace, split by special characters, convert to camelCase
  const cleanedUpName = addonName
    .replace(/^@storybook\//, '')
    .split(/[^a-zA-Z0-9]+/)
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('')
    .replace(/^./, (char) => char.toLowerCase());

  return `${cleanedUpName}Annotations`;
}

export async function getAddonAnnotations(addon: string) {
  try {
    const data = {
      importPath: `${addon}/preview`,
      importName: getAnnotationsName(addon),
    };
    // TODO: current workaround needed only for essentials, fix this once we change the preview entry-point for that package
    if (addon === '@storybook/addon-essentials') {
      data.importPath = '@storybook/addon-essentials/entry-preview';
    } else {
      require.resolve(path.join(addon, 'preview'));
    }

    return data;
  } catch (err) {}

  return null;
}

import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

import type { StorybookConfigRaw } from '@storybook/types';

import { loadConfig, printConfig } from '@storybook/core/csf-tools';

import { dedent } from 'ts-dedent';

import { getSyncedStorybookAddons } from './csf-factories-utils';
import { getAddonAnnotations } from './get-addon-annotations';

vi.mock('./get-addon-annotations');

expect.addSnapshotSerializer({
  serialize: (val: any) => (typeof val === 'string' ? dedent(val) : dedent(val.toString())),
  test: () => true,
});

describe('getSyncedStorybookAddons', () => {
  const mainConfig: StorybookConfigRaw = {
    stories: [],
    addons: ['custom-addon', '@storybook/addon-a11y'],
  };
  it('should sync addons between main and preview', async () => {
    const preview = loadConfig(`
      import * as myAddonAnnotations from "custom-addon/preview";
      import { definePreview } from "@storybook/react/preview";

      export default definePreview({
        addons: [myAddonAnnotations],
      });
    `).parse();

    (getAddonAnnotations as Mock).mockImplementation(() => {
      return { importName: 'addonA11yAnnotations', importPath: '@storybook/addon-a11y/preview' };
    });

    const result = await getSyncedStorybookAddons(mainConfig, preview);
    expect(printConfig(result).code).toMatchInlineSnapshot(`
      import * as addonA11yAnnotations from "@storybook/addon-a11y/preview";
      import * as myAddonAnnotations from "custom-addon/preview";
      import { definePreview } from "@storybook/react/preview";

      export default definePreview({
        addons: [myAddonAnnotations, addonA11yAnnotations],
      });
    `);
  });
  it('should add addons if the preview has no addons field', async () => {
    const originalCode = dedent`
      import { definePreview } from "@storybook/react/preview";

      export default definePreview({
        tags: []
      });
    `;
    const preview = loadConfig(originalCode).parse();

    (getAddonAnnotations as Mock).mockImplementation(() => {
      return { importName: 'addonA11yAnnotations', importPath: '@storybook/addon-a11y/preview' };
    });

    const result = await getSyncedStorybookAddons(mainConfig, preview);
    expect(printConfig(result).code).toMatchInlineSnapshot(`
      import * as addonA11yAnnotations from "@storybook/addon-a11y/preview";
      import { definePreview } from "@storybook/react/preview";

      export default definePreview({
        tags: [],
        addons: [addonA11yAnnotations]
      });
    `);
  });
  it('should not modify the code if all addons are already synced', async () => {
    const originalCode = dedent`
      import * as addonA11yAnnotations from "@storybook/addon-a11y/preview";
      import * as myAddonAnnotations from "custom-addon/preview";
      import { definePreview } from "@storybook/react/preview";

      export default definePreview({
        addons: [myAddonAnnotations, addonA11yAnnotations],
      });
    `;
    const preview = loadConfig(originalCode).parse();

    (getAddonAnnotations as Mock).mockImplementation(() => {
      return { importName: 'addonA11yAnnotations', importPath: '@storybook/addon-a11y/preview' };
    });

    const result = await getSyncedStorybookAddons(mainConfig, preview);
    expect(printConfig(result).code).toEqual(originalCode);
  });
});

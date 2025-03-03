import fs from 'node:fs';
import fsp from 'node:fs/promises';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JsPackageManager } from 'storybook/internal/common';

import { sep } from 'path';

import { IS_WINDOWS } from '../../../vitest.helpers';
import * as helpers from './helpers';
import type { SupportedRenderers } from './project_types';
import { SupportedLanguage } from './project_types';

const normalizePath = (path: string) => (IS_WINDOWS ? path.replace(/\//g, sep) : path);

const fsMocks = vi.hoisted(() => ({
  cpSync: vi.fn(() => ({})),
  existsSync: vi.fn(),
}));

const fspMocks = vi.hoisted(() => ({
  cp: vi.fn(() => ({})),
  readFile: vi.fn(() => ''),
  writeFile: vi.fn(),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    ...fsMocks,
    default: {
      ...actual,
      ...fsMocks,
    },
  };
});
vi.mock('./dirs', () => ({
  getRendererDir: (_: JsPackageManager, renderer: string) =>
    normalizePath(`@storybook/${renderer}`),
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    ...fspMocks,
    default: {
      ...actual,
      ...fspMocks,
    },
  };
});

vi.mock('find-up', () => ({
  sync: vi.fn(),
}));

vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('path')>();
  return {
    ...actual,
    // make it return just the second path, for easier testing
    resolve: vi.fn((_, p) => p),
  };
});

const packageManagerMock = {
  retrievePackageJson: async () => ({ dependencies: {}, devDependencies: {} }),
} as JsPackageManager;

describe('Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVersionSafe', () => {
    describe('installed', () => {
      it.each([
        ['3.0.0', '3.0.0'],
        ['5.0.0-next.0', '5.0.0-next.0'],
        [
          '4.2.19::__archiveUrl=https%3A%2F%2Fregistry.npmjs.org%2Fsvelte%2F-%2Fsvelte-4.2.19.tgz',
          '4.2.19',
        ],
      ])('svelte %s => %s', async (svelteVersion, expectedAddonSpecifier) => {
        const packageManager = {
          getInstalledVersion: async (pkg: string) =>
            pkg === 'svelte' ? svelteVersion : undefined,
          getAllDependencies: async () => ({ svelte: `^${svelteVersion}` }),
        } as any as JsPackageManager;
        await expect(helpers.getVersionSafe(packageManager, 'svelte')).resolves.toBe(
          expectedAddonSpecifier
        );
      });
    });

    describe('uninstalled', () => {
      it.each([
        ['^3', '3.0.0'],
        ['^5.0.0-next.0', '5.0.0-next.0'],
        [
          '4.2.19::__archiveUrl=https%3A%2F%2Fregistry.npmjs.org%2Fsvelte%2F-%2Fsvelte-4.2.19.tgz',
          '4.2.19',
        ],
      ])('svelte %s => %s', async (svelteSpecifier, expectedAddonSpecifier) => {
        const packageManager = {
          getInstalledVersion: async (pkg: string) => undefined,
          getAllDependencies: async () => ({ svelte: svelteSpecifier }),
        } as any as JsPackageManager;
        await expect(helpers.getVersionSafe(packageManager, 'svelte')).resolves.toBe(
          expectedAddonSpecifier
        );
      });
    });
  });

  describe('copyTemplate', () => {
    it(`should copy template files when directory is present`, () => {
      const csfDirectory = /template-csf\/$/;
      fsMocks.existsSync.mockReturnValue(true);

      helpers.copyTemplate('');

      expect(fs.cpSync).toHaveBeenCalledWith(
        expect.stringMatching(csfDirectory),
        expect.anything(),
        expect.anything()
      );
    });

    it(`should throw an error if template directory cannot be found`, () => {
      fsMocks.existsSync.mockReturnValue(false);

      expect(() => {
        helpers.copyTemplate('');
      }).toThrowError("Couldn't find template dir");
    });
  });

  it.each`
    language            | exists                        | expected
    ${'javascript'}     | ${['js', 'ts-4-9']}           | ${'/js'}
    ${'typescript-4-9'} | ${['js', 'ts-4-9']}           | ${'/ts-4-9'}
    ${'typescript-4-9'} | ${['js', 'ts-3-8']}           | ${'/ts-3-8'}
    ${'typescript-3-8'} | ${['js', 'ts-3-8', 'ts-4-9']} | ${'/ts-3-8'}
    ${'typescript-3-8'} | ${['js', 'ts-4-9']}           | ${'/js'}
    ${'typescript-4-9'} | ${['js']}                     | ${'/js'}
    ${'javascript'}     | ${[]}                         | ${''}
    ${'typescript-4-9'} | ${[]}                         | ${''}
  `(
    `should copy $expected when folder $exists exists for language $language`,
    async ({ language, exists, expected }) => {
      const componentsDirectory = exists.map((folder: string) =>
        normalizePath(`@storybook/react/template/cli/${folder}`)
      );
      fsMocks.existsSync.mockImplementation(
        (filePath) =>
          componentsDirectory.includes(filePath) ||
          filePath === normalizePath('@storybook/react/template/cli')
      );
      await helpers.copyTemplateFiles({
        renderer: 'react',
        language,
        packageManager: packageManagerMock,
        commonAssetsDir: normalizePath('create-storybook/rendererAssets/common'),
        features: ['dev', 'docs', 'test'],
      });

      expect(fsp.cp).toHaveBeenNthCalledWith(
        1,
        normalizePath('create-storybook/rendererAssets/common'),
        './stories',
        expect.anything()
      );

      const expectedDirectory = normalizePath(`@storybook/react/template/cli${expected}`);
      expect(fsp.cp).toHaveBeenNthCalledWith(2, expectedDirectory, './stories', expect.anything());
    }
  );

  it(`should copy to src folder when exists`, async () => {
    vi.mocked(fs.existsSync).mockImplementation((filePath) => {
      return filePath === normalizePath('@storybook/react/template/cli') || filePath === './src';
    });
    await helpers.copyTemplateFiles({
      renderer: 'react',
      language: SupportedLanguage.JAVASCRIPT,
      packageManager: packageManagerMock,
      features: ['dev', 'docs', 'test'],
    });
    expect(fsp.cp).toHaveBeenCalledWith(expect.anything(), './src/stories', expect.anything());
  });

  it(`should copy to root folder when src doesn't exist`, async () => {
    vi.mocked(fs.existsSync).mockImplementation((filePath) => {
      return filePath === normalizePath('@storybook/react/template/cli');
    });
    await helpers.copyTemplateFiles({
      renderer: 'react',
      language: SupportedLanguage.JAVASCRIPT,
      packageManager: packageManagerMock,
      features: ['dev', 'docs', 'test'],
    });
    expect(fsp.cp).toHaveBeenCalledWith(expect.anything(), './stories', expect.anything());
  });

  it(`should throw an error for unsupported renderer`, async () => {
    const renderer = 'unknown renderer' as SupportedRenderers;
    const expectedMessage = `Unsupported renderer: ${renderer}`;
    await expect(
      helpers.copyTemplateFiles({
        renderer,
        language: SupportedLanguage.JAVASCRIPT,
        packageManager: packageManagerMock,
        features: ['dev', 'docs', 'test'],
      })
    ).rejects.toThrowError(expectedMessage);
  });

  describe('getStorybookVersionSpecifier', () => {
    it(`should return the specifier if storybook lib exists in package.json`, () => {
      expect(
        helpers.getStorybookVersionSpecifier({
          dependencies: {},
          devDependencies: {
            '@storybook/react': '^x.x.x',
          },
        })
      ).toEqual('^x.x.x');
    });

    it(`should throw an error if no package is found`, () => {
      expect(() => {
        helpers.getStorybookVersionSpecifier({
          dependencies: {},
          devDependencies: {
            'something-else': '^x.x.x',
          },
        });
      }).toThrowError("Couldn't find any official storybook packages in package.json");
    });
  });

  describe('coerceSemver', () => {
    it(`should throw if the version argument is invalid semver string`, () => {
      const invalidSemverString = 'hello, world';
      expect(() => {
        helpers.coerceSemver(invalidSemverString);
      }).toThrowError(`Could not coerce ${invalidSemverString} into a semver.`);
    });
  });

  describe('hasStorybookDependencies', () => {
    it(`should return true when any storybook dependency exists`, async () => {
      const result = await helpers.hasStorybookDependencies({
        getAllDependencies: async () => ({ storybook: 'x.y.z' }),
      } as unknown as JsPackageManager);
      expect(result).toEqual(true);
    });

    it(`should return false when no storybook dependency exists`, async () => {
      const result = await helpers.hasStorybookDependencies({
        getAllDependencies: async () => ({ axios: 'x.y.z' }),
      } as unknown as JsPackageManager);
      expect(result).toEqual(false);
    });
  });
});

import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// eslint-disable-next-line depend/ban-dependencies
import ora from 'ora';
import invariant from 'tiny-invariant';
import { dedent } from 'ts-dedent';

import type { NpmOptions } from '../../../../core/src/cli/NpmOptions';
import { detectBuilder } from '../../../../core/src/cli/detect';
import { configureEslintPlugin, extractEslintInfo } from '../../../../core/src/cli/eslintPlugin';
import { copyTemplateFiles } from '../../../../core/src/cli/helpers';
import {
  type Builder,
  ProjectType,
  SupportedLanguage,
  externalFrameworks,
} from '../../../../core/src/cli/project_types';
import {
  type JsPackageManager,
  getPackageDetails,
} from '../../../../core/src/common/js-package-manager/JsPackageManager';
import versions from '../../../../core/src/common/versions';
import type { SupportedFrameworks } from '../../../../core/src/types/modules/frameworks';
import type { SupportedRenderers } from '../../../../core/src/types/modules/renderers';
import { configureMain, configurePreview } from './configure';
import type { FrameworkOptions, GeneratorOptions } from './types';

const logger = console;

const defaultOptions: FrameworkOptions = {
  extraPackages: [],
  extraAddons: [],
  staticDir: undefined,
  addScripts: true,
  addMainFile: true,
  addPreviewFile: true,
  addComponents: true,
  webpackCompiler: () => undefined,
  extraMain: undefined,
  framework: undefined,
  extensions: undefined,
  componentsDestinationPath: undefined,
  storybookConfigFolder: '.storybook',
  installFrameworkPackages: true,
};

const getBuilderDetails = (builder: string) => {
  const map = versions as Record<string, string>;

  if (map[builder]) {
    return builder;
  }

  const builderPackage = `@storybook/${builder}`;
  if (map[builderPackage]) {
    return builderPackage;
  }

  return builder;
};

const getExternalFramework = (framework?: string) =>
  externalFrameworks.find(
    (exFramework) =>
      framework !== undefined &&
      (exFramework.name === framework ||
        exFramework.packageName === framework ||
        exFramework?.frameworks?.some?.((item) => item === framework))
  );

const getFrameworkPackage = (framework: string | undefined, renderer: string, builder: string) => {
  const externalFramework = getExternalFramework(framework);
  const storybookBuilder = builder?.replace(/^@storybook\/builder-/, '');
  const storybookFramework = framework?.replace(/^@storybook\//, '');

  if (externalFramework === undefined) {
    const frameworkPackage = framework
      ? `@storybook/${storybookFramework}`
      : `@storybook/${renderer}-${storybookBuilder}`;

    if (versions[frameworkPackage as keyof typeof versions]) {
      return frameworkPackage;
    }

    throw new Error(
      dedent`
        Could not find framework package: ${frameworkPackage}.
        Make sure this package exists, and if it does, please file an issue as this might be a bug in Storybook.
      `
    );
  }

  return (
    externalFramework.frameworks?.find((item) => item.match(new RegExp(`-${storybookBuilder}`))) ??
    externalFramework.packageName
  );
};

const getRendererPackage = (framework: string | undefined, renderer: string) => {
  const externalFramework = getExternalFramework(framework);

  if (externalFramework !== undefined) {
    return externalFramework.renderer || externalFramework.packageName;
  }

  return `@storybook/${renderer}`;
};

const applyRequireWrapper = (packageName: string) => `%%getAbsolutePath('${packageName}')%%`;

const applyAddonRequireWrapper = (pkg: string | { name: string }) => {
  if (typeof pkg === 'string') {
    return applyRequireWrapper(pkg);
  }
  const obj = { ...pkg } as { name: string };
  obj.name = applyRequireWrapper(pkg.name);
  return obj;
};

const getFrameworkDetails = (
  renderer: SupportedRenderers,
  builder: Builder,
  pnp: boolean,
  language: SupportedLanguage,
  framework?: SupportedFrameworks,
  shouldApplyRequireWrapperOnPackageNames?: boolean
): {
  type: 'framework' | 'renderer';
  packages: string[];
  builder?: string;
  framework?: string;
  renderer?: string;
  rendererId: SupportedRenderers;
  frameworkPackage?: string;
} => {
  const frameworkPackage = getFrameworkPackage(framework, renderer, builder);
  invariant(frameworkPackage, 'Missing framework package.');

  const frameworkPackagePath = shouldApplyRequireWrapperOnPackageNames
    ? applyRequireWrapper(frameworkPackage)
    : frameworkPackage;

  const rendererPackage = getRendererPackage(framework, renderer) as string;
  const rendererPackagePath = shouldApplyRequireWrapperOnPackageNames
    ? applyRequireWrapper(rendererPackage)
    : rendererPackage;

  const builderPackage = getBuilderDetails(builder);
  const builderPackagePath = shouldApplyRequireWrapperOnPackageNames
    ? applyRequireWrapper(builderPackage)
    : builderPackage;

  const isExternalFramework = !!getExternalFramework(frameworkPackage);
  const isKnownFramework =
    isExternalFramework || !!(versions as Record<string, string>)[frameworkPackage];
  const isKnownRenderer = !!(versions as Record<string, string>)[rendererPackage];

  if (isKnownFramework) {
    return {
      packages: [rendererPackage, frameworkPackage],
      framework: frameworkPackagePath,
      frameworkPackage,
      rendererId: renderer,
      type: 'framework',
    };
  }

  if (isKnownRenderer) {
    return {
      packages: [rendererPackage, builderPackage],
      builder: builderPackagePath,
      renderer: rendererPackagePath,
      rendererId: renderer,
      type: 'renderer',
    };
  }

  throw new Error(
    `Could not find the framework (${frameworkPackage}) or renderer (${rendererPackage}) package`
  );
};

const stripVersions = (addons: string[]) => addons.map((addon) => getPackageDetails(addon)[0]);

const hasInteractiveStories = (rendererId: SupportedRenderers) =>
  ['react', 'angular', 'preact', 'svelte', 'vue3', 'html', 'solid', 'qwik'].includes(rendererId);

const hasFrameworkTemplates = (framework?: SupportedFrameworks) => {
  if (!framework) {
    return false;
  }
  // Nuxt has framework templates, but for sandboxes we create them from the Vue3 renderer
  // As the Nuxt framework templates are not compatible with the stories we need for CI.
  // See: https://github.com/storybookjs/storybook/pull/28607#issuecomment-2467903327
  if (framework === 'nuxt') {
    return process.env.IN_STORYBOOK_SANDBOX !== 'true';
  }
  return ['angular', 'nextjs', 'react-native-web-vite'].includes(framework);
};

export async function baseGenerator(
  packageManager: JsPackageManager,
  npmOptions: NpmOptions,
  { language, builder, pnp, frameworkPreviewParts, projectType, features }: GeneratorOptions,
  renderer: SupportedRenderers,
  options: FrameworkOptions = defaultOptions,
  framework?: SupportedFrameworks
) {
  const isStorybookInMonorepository = packageManager.isStorybookInMonorepo();
  const shouldApplyRequireWrapperOnPackageNames = isStorybookInMonorepository || pnp;

  if (!builder) {
    builder = await detectBuilder(packageManager as any, projectType);
  }

  if (features.includes('test')) {
    const supportedFrameworks: ProjectType[] = [
      ProjectType.REACT,
      ProjectType.VUE3,
      ProjectType.NEXTJS,
      ProjectType.NUXT,
      ProjectType.PREACT,
      ProjectType.SVELTE,
      ProjectType.SVELTEKIT,
      ProjectType.WEB_COMPONENTS,
    ];
    const supportsTestAddon =
      projectType === ProjectType.NEXTJS ||
      (builder !== 'webpack5' && supportedFrameworks.includes(projectType));
    if (!supportsTestAddon) {
      features.splice(features.indexOf('test'), 1);
    }
  }

  const {
    packages: frameworkPackages,
    type,
    rendererId,
    framework: frameworkInclude,
    builder: builderInclude,
    frameworkPackage,
  } = getFrameworkDetails(
    renderer,
    builder,
    pnp,
    language,
    framework,
    shouldApplyRequireWrapperOnPackageNames
  );

  const {
    extraAddons: extraAddonPackages = [],
    extraPackages,
    staticDir,
    addScripts,
    addMainFile,
    addPreviewFile,
    addComponents,
    extraMain,
    extensions,
    storybookConfigFolder,
    componentsDestinationPath,
    webpackCompiler,
    installFrameworkPackages,
  } = {
    ...defaultOptions,
    ...options,
  };

  const compiler = webpackCompiler ? webpackCompiler({ builder }) : undefined;

  const essentials = features.includes('docs')
    ? '@storybook/addon-essentials'
    : { name: '@storybook/addon-essentials', options: { docs: false } };

  const extraAddonsToInstall =
    typeof extraAddonPackages === 'function'
      ? await extraAddonPackages({
          builder: (builder || builderInclude) as string,
          framework: (framework || frameworkInclude) as string,
        })
      : extraAddonPackages;

  // TODO: change the semver range to '^4' when VTA 4 and SB 9 is released
  extraAddonsToInstall.push('@chromatic-com/storybook@^4.0.0-0');

  // added to main.js
  const addons = [
    ...(compiler ? [`@storybook/addon-webpack5-compiler-${compiler}`] : []),
    essentials,
    ...stripVersions(extraAddonsToInstall),
  ].filter(Boolean);

  // added to package.json
  const addonPackages = [
    '@storybook/addon-essentials',
    '@storybook/blocks',
    '@storybook/test',
    ...(compiler ? [`@storybook/addon-webpack5-compiler-${compiler}`] : []),
    ...extraAddonsToInstall,
  ].filter(Boolean);

  if (hasInteractiveStories(rendererId) && !features.includes('test')) {
    addons.push('@storybook/addon-interactions');
    addonPackages.push('@storybook/addon-interactions');
  }

  const packageJson = await packageManager.retrievePackageJson();
  const installedDependencies = new Set(
    Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies })
  );

  // TODO: We need to start supporting this at some point
  if (type === 'renderer') {
    throw new Error(
      dedent`
        Sorry, for now, you can not do this, please use a framework such as @storybook/react-webpack5

        https://github.com/storybookjs/storybook/issues/18360
      `
    );
  }

  const extraPackagesToInstall =
    typeof extraPackages === 'function'
      ? await extraPackages({
          builder: (builder || builderInclude) as string,
          framework: (framework || frameworkInclude) as string,
        })
      : extraPackages;

  const allPackages = [
    'storybook',
    getExternalFramework(rendererId) ? undefined : `@storybook/${rendererId}`,
    ...(installFrameworkPackages ? frameworkPackages : []),
    ...addonPackages,
    ...(extraPackagesToInstall || []),
  ].filter(Boolean);

  const packages = [...new Set(allPackages)].filter(
    (packageToInstall) =>
      !installedDependencies.has(getPackageDetails(packageToInstall as string)[0])
  );

  logger.log();
  const versionedPackagesSpinner = ora({
    indent: 2,
    text: `Getting the correct version of ${packages.length} packages`,
  }).start();
  const versionedPackages = await packageManager.getVersionedPackages(packages as string[]);
  versionedPackagesSpinner.succeed();

  try {
    if (process.env.CI !== 'true') {
      const { hasEslint, isStorybookPluginInstalled, eslintConfigFile } = await extractEslintInfo(
        packageManager as any
      );

      if (hasEslint && !isStorybookPluginInstalled) {
        versionedPackages.push('eslint-plugin-storybook');
        await configureEslintPlugin(eslintConfigFile ?? undefined, packageManager as any);
      }
    }
  } catch (err) {
    // any failure regarding configuring the eslint plugin should not fail the whole generator
  }

  if (versionedPackages.length > 0) {
    const addDependenciesSpinner = ora({
      indent: 2,
      text: 'Installing Storybook dependencies',
    }).start();

    await packageManager.addDependencies({ ...npmOptions, packageJson }, versionedPackages);
    addDependenciesSpinner.succeed();
  }

  if (addMainFile || addPreviewFile) {
    await mkdir(`./${storybookConfigFolder}`, { recursive: true });
  }

  if (addMainFile) {
    const prefixes = shouldApplyRequireWrapperOnPackageNames
      ? [
          'import { join, dirname } from "path"',
          language === SupportedLanguage.JAVASCRIPT
            ? dedent`/**
            * This function is used to resolve the absolute path of a package.
            * It is needed in projects that use Yarn PnP or are set up within a monorepo.
            */
            function getAbsolutePath(value) {
              return dirname(require.resolve(join(value, 'package.json')))
            }`
            : dedent`/**
          * This function is used to resolve the absolute path of a package.
          * It is needed in projects that use Yarn PnP or are set up within a monorepo.
          */
          function getAbsolutePath(value: string): any {
            return dirname(require.resolve(join(value, 'package.json')))
          }`,
        ]
      : [];

    await configureMain({
      framework: {
        name: frameworkInclude,
        options: options.framework || {},
      },
      frameworkPackage,
      prefixes,
      storybookConfigFolder,
      addons: shouldApplyRequireWrapperOnPackageNames
        ? addons.map((addon) => applyAddonRequireWrapper(addon))
        : addons,
      extensions,
      language,
      ...(staticDir ? { staticDirs: [join('..', staticDir)] } : null),
      ...extraMain,
      ...(type !== 'framework'
        ? {
            core: {
              builder: builderInclude,
            },
          }
        : {}),
    });
  }

  if (addPreviewFile) {
    await configurePreview({
      frameworkPreviewParts,
      storybookConfigFolder: storybookConfigFolder as string,
      language,
      rendererId,
    });
  }

  if (addScripts) {
    await packageManager.addStorybookCommandInScripts({
      port: 6006,
    });
  }

  if (addComponents) {
    const templateLocation = hasFrameworkTemplates(framework) ? framework : rendererId;
    if (!templateLocation) {
      throw new Error(`Could not find template location for ${framework} or ${rendererId}`);
    }
    await copyTemplateFiles({
      renderer: templateLocation,
      packageManager: packageManager as any,
      language,
      destination: componentsDestinationPath,
      commonAssetsDir: join(getCliDir(), 'rendererAssets', 'common'),
      features,
    });
  }
}

export function getCliDir() {
  return dirname(require.resolve('create-storybook/package.json'));
}

import path from 'node:path';

import dirSize from 'fast-folder-size';
// eslint-disable-next-line depend/ban-dependencies
import { pathExists, remove } from 'fs-extra';
import { join } from 'path';
import { promisify } from 'util';

import { now, saveBench } from '../bench/utils';
import type { Task, TaskKey } from '../task';

const logger = console;

export const sandbox: Task = {
  description: 'Create the sandbox from a template',
  dependsOn: ({ template }, { link }) => {
    if ('inDevelopment' in template && template.inDevelopment) {
      return ['run-registry', 'generate'];
    }

    if (link) {
      return ['compile'];
    }

    return ['run-registry'];
  },
  async ready({ sandboxDir }, { task: selectedTask }) {
    // If the selected task requires the sandbox to exist, we check it. Else we always assume it needs to be created
    // This avoids issues where you want to overwrite a sandbox and it will stop because it already exists
    const tasksAfterSandbox: TaskKey[] = [
      'vitest-integration',
      'test-runner',
      'test-runner-dev',
      'e2e-tests',
      'e2e-tests-dev',
      'smoke-test',
      'dev',
      'build',
      'serve',
      'chromatic',
      'bench',
    ];
    const isSelectedTaskAfterSandboxCreation = tasksAfterSandbox.includes(selectedTask);
    return isSelectedTaskAfterSandboxCreation && pathExists(sandboxDir);
  },
  async run(details, options) {
    if (options.link && details.template.inDevelopment) {
      logger.log(
        `The ${options.template} has inDevelopment property enabled, therefore the sandbox for that template cannot be linked. Enabling --no-link mode..`
      );

      options.link = false;
    }

    if (!(await this.ready(details, options))) {
      logger.info('🗑  Removing old sandbox dir');
      await remove(details.sandboxDir);
    }

    const {
      create,
      install,
      addStories,
      extendMain,
      extendPreview,
      init,
      addExtraDependencies,
      setImportMap,
      setupVitest,
      runMigrations,
    } = await import('./sandbox-parts');

    const extraDeps = [
      ...(details.template.modifications?.extraDependencies ?? []),
      // The storybook package forwards some CLI commands to @storybook/cli with npx.
      // Adding the dep makes sure that even npx will use the linked workspace version.
      '@storybook/cli',
    ];

    const shouldAddVitestIntegration = !details.template.skipTasks?.includes('vitest-integration');

    if (shouldAddVitestIntegration) {
      extraDeps.push('happy-dom', 'vitest', 'playwright', '@vitest/browser');

      if (details.template.expected.framework.includes('nextjs')) {
        extraDeps.push('@storybook/experimental-nextjs-vite', 'jsdom');
      }

      // if (details.template.expected.renderer === '@storybook/svelte') {
      //   extraDeps.push(`@testing-library/svelte`);
      // }
      //
      // if (details.template.expected.framework === '@storybook/angular') {
      //   extraDeps.push('@testing-library/angular', '@analogjs/vitest-angular');
      // }

      options.addon = [...options.addon, '@storybook/addon-test', '@storybook/addon-a11y'];
    }

    let startTime = now();
    await create(details, options);
    const createTime = now() - startTime;
    const createSize = 0;

    startTime = now();
    await install(details, options);
    const generateTime = now() - startTime;
    const generateSize = await promisify(dirSize)(join(details.sandboxDir, 'node_modules'));

    startTime = now();
    await init(details, options);
    const initTime = now() - startTime;
    const initSize = await promisify(dirSize)(join(details.sandboxDir, 'node_modules'));

    await saveBench(
      'sandbox',
      {
        createTime,
        generateTime,
        initTime,
        createSize,
        generateSize,
        initSize,
        diffSize: initSize - generateSize,
      },
      { rootDir: details.sandboxDir }
    );

    if (!options.skipTemplateStories) {
      await addStories(details, options);
    }

    if (shouldAddVitestIntegration) {
      await setupVitest(details, options);
    }

    await addExtraDependencies({
      cwd: details.sandboxDir,
      debug: options.debug,
      dryRun: options.dryRun,
      extraDeps,
    });

    await extendMain(details, options);

    await setImportMap(details.sandboxDir);

    const { JsPackageManagerFactory } = await import('../../code/core/src/common');

    const packageManager = JsPackageManagerFactory.getPackageManager({}, details.sandboxDir);

    await remove(path.join(details.sandboxDir, 'node_modules'));
    await packageManager.installDependencies();

    await runMigrations(details, options);

    await extendPreview(details, options);

    logger.info(`✅ Storybook sandbox created at ${details.sandboxDir}`);
  },
};

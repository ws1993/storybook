import { loadConfig, printConfig } from 'storybook/internal/csf-tools';

import { formatly } from 'formatly';
import { mkdir, rm, stat, writeFile } from 'fs/promises';
import { join } from 'path/posix';

import type { State } from '../steps';

export const runConfigGeneration = async (state: State, print: (txt: string) => void) => {
  const configDir = join(state.directory, '.storybook');
  const useTypeScript = state.features?.includes('typescript');
  const hasTestIntent = state.intents?.includes('test');
  const mainFile = useTypeScript ? 'main.ts' : 'main.mjs';
  const previewFile = useTypeScript ? 'preview.ts' : 'preview.mjs';
  const vitestWorkspaceFile = useTypeScript ? 'vitest.workspace.ts' : 'vitest.workspace.mjs';
  const vitestConfigFile = useTypeScript ? 'vitest.config.ts' : 'vitest.config.mjs';
  const vitestSetupFile = useTypeScript ? 'vitest.setup.ts' : 'vitest.setup.mjs';

  // ensure the directory exists
  await stat(configDir)
    .then((dir) => {
      if (dir.isDirectory()) {
        print('.storybook folder already exists, deleting contents');
        return rm(configDir, { recursive: true });
      } else {
        print('.storybook is not a directory, deleting');
        return rm(configDir);
      }
    })
    .catch()
    .then(() => {
      print('Creating .storybook folder');
      return mkdir(configDir);
    });

  print(`Generating ${mainFile}`);
  const configFilePath = join(configDir, mainFile);
  await writeFile(configFilePath, createMainFile(state, mainFile));
  await formatly([configFilePath], { cwd: state.directory }).catch();
  print(`Generated ${mainFile}`);

  print(`Generating ${previewFile}`);
  await writeFile(join(configDir, mainFile), `export const parameters = {};\n`);
  print(`Generated ${previewFile}`);

  print(`Generating ${previewFile}`);
  await writeFile(join(configDir, mainFile), `export const parameters = {};\n`);
  print(`Generated ${previewFile}`);

  if (hasTestIntent) {
    print(`Generating ${vitestWorkspaceFile}`);
    await writeFile(join(state.directory, vitestWorkspaceFile), `export const parameters = {};\n`);
    print(`Generated ${vitestWorkspaceFile}`);

    print(`Generating ${vitestConfigFile}`);
    await writeFile(join(state.directory, vitestConfigFile), `export const parameters = {};\n`);
    print(`Generated ${previewFile}`);

    print(`Generating ${vitestSetupFile}`);
    await writeFile(join(configDir, vitestSetupFile), `export const parameters = {};\n`);
    print(`Generated ${vitestSetupFile}`);
  }
};

export const createMainFile = (state: State, fileName: string) => {
  const useTypeScript = state.features?.includes('typescript');
  const useOnboarding = state.features?.includes('onboarding');
  const useVRT = state.features?.includes('vrt');
  const useTesting = state.intents?.includes('test');
  const useDocs = state.intents?.includes('docs');
  const useEssentials = state.features?.includes('essentials');

  const ConfigFile = loadConfig(
    useTypeScript
      ? `
        import type { StorybookConfig } from '${state.framework}';

        const config: StorybookConfig = {
        };

        export default config;
      `
      : `
        export default {};
      `,
    fileName
  ).parse();

  const stories: string[] = ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'];
  ConfigFile.setFieldValue(['stories'], stories);

  ConfigFile.setFieldValue(['framework'], { name: state.framework, options: {} });

  const addons: any[] = [];
  if (state.features?.includes('essentials')) {
    if (!state.intents?.includes('docs')) {
      addons.push({
        name: '@storybook/addon-essentials',
        options: {
          docs: false,
        },
      });
    } else {
      addons.push('@storybook/addon-essentials');
    }
  }
  if (useOnboarding) {
    addons.push('@storybook/addon-onboarding');
  }
  if (useVRT) {
    addons.push('@chromatic-com/storybook');
  }
  if (useTesting) {
    addons.push('@storybook/experimental-addon-test');
  }
  if (useDocs && !useEssentials) {
    addons.push('@storybook/addon-docs');
  }
  ConfigFile.setFieldValue(['addons'], addons);

  return printConfig(ConfigFile).code;
};

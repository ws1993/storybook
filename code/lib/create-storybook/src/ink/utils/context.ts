import { createContext } from 'react';

// import type { checkExists, downloadSandbox } from '../steps/ExistsResult';
// import type { checkFramework } from '../steps/Framework';
// import type { checkGitStatus } from '../steps/Git';
// import type { checkVersion } from '../steps/Version';

export const AppContext = createContext({
  fs: undefined as typeof import('fs/promises') | undefined,
  path: undefined as typeof import('path') | undefined,
  process: undefined as typeof import('process') | undefined,
  child_process: undefined as typeof import('child_process') | undefined,
  require: undefined as NodeRequire | undefined,
  findUp: undefined as typeof import('find-up').findUp | undefined,
  glob: undefined as typeof import('fast-glob') | undefined,
  // checkGitStatus: undefined as typeof checkGitStatus | undefined,
  // checkVersion: undefined as typeof checkVersion | undefined,
  // checkFramework: undefined as typeof checkFramework | undefined,
  // checkExists: undefined as typeof checkExists | undefined,
  // downloadSandbox: undefined as typeof downloadSandbox | undefined,
  // runConfigGeneration: undefined as
  //   | typeof import('../utils/runConfigGeneration').runConfigGeneration
  //   | undefined,
  babel: undefined as typeof import('@storybook/core/babel') | undefined,
  telemetry: undefined as typeof import('@storybook/core/telemetry').telemetry | undefined,
  packageManager: undefined as import('@storybook/core/common').JsPackageManager | undefined,
  JsPackageManagerFactory: undefined as
    | (typeof import('@storybook/core/common'))['JsPackageManagerFactory']
    | undefined,
});

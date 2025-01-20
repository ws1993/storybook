import { createContext } from 'react';

import type { checkCompatibility } from '../steps/Check';
import type { checkGitStatus } from '../steps/Git';
import type { checkFramework, checkVersion } from './checks';

export const AppContext = createContext({
  fs: undefined as typeof import('fs/promises') | undefined,
  process: undefined as typeof import('process') | undefined,
  child_process: undefined as typeof import('child_process') | undefined,
  require: undefined as NodeRequire | undefined,
  glob: undefined as typeof import('fast-glob') | undefined,
  steps: {
    GIT: undefined as typeof checkGitStatus | undefined,
    CHECK: undefined as typeof checkCompatibility | undefined,
    VERSION: undefined as typeof checkVersion | undefined,
    FRAMEWORK: undefined as typeof checkFramework | undefined,
  },
});

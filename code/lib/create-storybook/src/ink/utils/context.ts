import { createContext } from 'react';

import type { checkCompatibility } from '../steps/check';

export const AppContext = createContext({
  fs: undefined as typeof import('fs/promises') | undefined,
  process: undefined as typeof import('process') | undefined,
  child_process: undefined as typeof import('child_process') | undefined,
  require: undefined as NodeRequire | undefined,
  glob: undefined as typeof import('fast-glob') | undefined,
  steps: {
    GIT: undefined as any,
    CHECK: undefined as typeof checkCompatibility | undefined,
    // DIRECTORY: undefined as typeof checkCompatibility | undefined,
    FRAMEWORK: undefined as any,
    INSTALL: undefined as any,
    VERSION: undefined as any,
    DONE: undefined as any,
  },
});

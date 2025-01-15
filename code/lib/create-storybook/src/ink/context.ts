import { createContext } from 'react';

export const AppContext = createContext({
  fs: undefined as typeof import('fs/promises') | undefined,
  process: undefined as typeof import('process') | undefined,
  child_process: undefined as typeof import('child_process') | undefined,
});

import type { ContextType, FC } from 'react';
import { type Dispatch } from 'react';

import { type Action, type State } from '..';
import type { AppContext } from '../../utils/context';
import { configDir } from './configDir';
import { frameworkTest } from './frameworkTest';

export const CompatibilityType = {
  LOADING: 'loading' as const,
  IGNORED: 'ignored' as const,
  COMPATIBLE: 'compatible' as const,
  INCOMPATIBLE: 'incompatible' as const,
};

export type CompatibilityResult =
  | { type: typeof CompatibilityType.LOADING }
  | { type: typeof CompatibilityType.IGNORED }
  | { type: typeof CompatibilityType.COMPATIBLE }
  | { type: typeof CompatibilityType.INCOMPATIBLE; reasons: string[] };

export interface Check {
  condition: (
    context: ContextType<typeof AppContext>,
    state: State
  ) => Promise<CompatibilityResult>;
  render: FC<{
    s: CompatibilityResult;
    state: State;
    setter: (val: CompatibilityResult) => void;
    dispatch: Dispatch<Action>;
  }>;
}

/*
 * Checks:
 *
 * - When configDir already exists, prompt:
 *   - Yes -> overwrite (delete)
 *   - No -> exit
 * - When selecting framework that doesn't support test addon, suggest using experimental-nextjs-vite or prompt for ignoring test intent
 *   - Yes -> ignore test intent
 *   - No -> exit
 * - Detect existing Vitest/MSW version, if mismatch prompt for ignoring test intent
 *   - Yes -> ignore test intent
 *   - No -> exit
 * - Check for presence of nextjs when using @storybook/nextjs, if mismatch prompt
 *   - Yes -> continue
 *   - No -> exit
 * - Check if existing Vitest workspace file can be safaley modified, if not prompt:
 *   - Yes -> ignore test intent
 *   - No -> exit
 * - Check if existing Vite config file can be safaley modified, if not prompt:
 *   - Yes -> ignore test intent
 *   - No -> exit
 * -
 */
export const checks = {
  configDir,
  frameworkTest,
} satisfies Record<string, Check>;

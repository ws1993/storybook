import { type Dispatch, type FC } from 'react';

import type { Input } from '../app';
import { getKeys } from '../utils/getKeys';
import { CHECK } from './Check';
import { DIRECTORY } from './Directory';
import { FEATURES } from './Features';
import { FRAMEWORK } from './Framework';
import { GIT } from './Git';
import { INSTALL } from './Install';
import { INTENTS } from './Intents';
import { RUN } from './Run';
import { SANDBOX } from './Sandbox';
import { VERSION } from './Version';

export const steps = {
  GIT,
  VERSION,
  DIRECTORY,
  FRAMEWORK,
  INTENTS,
  FEATURES,
  CHECK,
  INSTALL,
  SANDBOX,
  RUN,
} satisfies Record<string, FC<{ state: State; dispatch: Dispatch<Action> }>>;
const keys = getKeys(steps);

export const ACTIONS = {
  NEXT: 'NEXT',
  IGNORE_GIT: 'IGNORE_GIT',
  IGNORE_VERSION: 'IGNORE_VERSION',
  DIRECTORY: 'DIRECTORY',
  FRAMEWORK: 'FRAMEWORK',
  INTENTS: 'INTENTS',
  FEATURES: 'FEATURES',
  INSTALL: 'INSTALL',
  EXIT: 'EXIT',
} as const;

export type Action =
  | {
      type: (typeof ACTIONS)['NEXT'];
    }
  | {
      type: (typeof ACTIONS)['IGNORE_GIT'];
    }
  | {
      type: (typeof ACTIONS)['IGNORE_VERSION'];
      payload: { value: 'latest' | 'outdated' };
    }
  | {
      type: (typeof ACTIONS)['DIRECTORY'];
      payload: { path: string };
    }
  | {
      type: (typeof ACTIONS)['FRAMEWORK'];
      payload: { id: State['framework'] };
    }
  | {
      type: (typeof ACTIONS)['INTENTS'];
      payload: { list: State['intents'] };
    }
  | {
      type: (typeof ACTIONS)['FEATURES'];
      payload: { list: State['features'] };
    }
  | {
      type: (typeof ACTIONS)['INSTALL'];
      payload: { value: boolean };
    }
  | {
      type: (typeof ACTIONS)['EXIT'];
      payload: { code: number; reasons: string[] };
    };

export type State = Omit<Input, 'width' | 'height'> & {
  step: keyof typeof steps;
  directory: string;
  version: 'latest' | 'outdated' | undefined;
};
export function reducer(state: State, action: Action): State {
  const current = keys.indexOf(state.step);
  const next = current === keys.length - 1 ? keys[current] : keys[current + 1];

  switch (action.type) {
    case ACTIONS.NEXT:
      return { ...state, step: next };
    case ACTIONS.IGNORE_GIT:
      return {
        ...state,
        ignoreGitNotClean: true,
        step: next,
      };
    case ACTIONS.IGNORE_VERSION:
      return {
        ...state,
        ignoreVersion: true,
        version: action.payload.value,
        step: next,
      };
    case ACTIONS.DIRECTORY:
      return {
        ...state,
        directory: action.payload.path,
        step: next,
      };
    case ACTIONS.FRAMEWORK:
      return { ...state, framework: action.payload.id, step: next };
    case ACTIONS.INTENTS:
      return { ...state, intents: action.payload.list, step: next };
    case ACTIONS.FEATURES:
      return {
        ...state,
        features: action.payload.list,
        step: next,
      };
    case ACTIONS.INSTALL:
      return { ...state, install: action.payload.value, step: next };
    case ACTIONS.EXIT:
      process.exit(0);
    default:
      return state;
  }
}

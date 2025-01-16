import { isAbsolute, join } from 'node:path';
import { cwd } from 'node:process';

import React, { type Dispatch, type FC, useEffect, useReducer, useState } from 'react';

import { Box, Text, useInput } from 'ink';

import { supportedFrameworksMap } from '../bin/modernInputs';
import type { Input } from './app';
import { MultiSelect } from './components/Select/MultiSelect';
import { ConfigGeneration } from './procedures/ConfigGeneration';
import { Installation } from './procedures/Installation';
import type {
  CompatibilityResult,
  ExistsResult,
  FrameworkResult,
  GitResult,
  VersionResult,
} from './utils/checks';
import {
  checkCompatibility,
  checkExists,
  checkFramework,
  checkGitStatus,
  checkVersion,
} from './utils/checks';
import { getKeys } from './utils/getKeys';

const steps = {
  GIT: ({ state, dispatch }) => {
    const [git, setGit] = useState<GitResult>('loading');

    useInput((input, key) => {
      if (git === 'unclean' && key.return) {
        dispatch({ type: ACTIONS.NEXT });
      }
    });

    useEffect(() => {
      checkGitStatus().then((result) => {
        if (result) {
          dispatch({ type: ACTIONS.NEXT });
        } else {
          setGit(result);
        }
      });
    }, []);
    return (
      <Box>
        {git === 'loading' && <Text>- Checking git state...</Text>}
        {git === 'unclean' && <Text>- Git is not clean, are you sure you want to continue?</Text>}
      </Box>
    );
  },
  VERSION: ({ state, dispatch }) => {
    const [version, setVersion] = useState<VersionResult>('loading');

    useInput((input, key) => {
      if (version === 'outdated' && key.return) {
        dispatch({ type: ACTIONS.NEXT });
      }
    });

    useEffect(() => {
      checkVersion().then((result) => {
        if (result) {
          dispatch({ type: 'NEXT' });
        } else {
          setVersion(result);
        }
      });
    }, []);
    return (
      <Box>
        {version === 'loading' && <Text>- Checking version state...</Text>}
        {version === 'outdated' && (
          <Text>
            This is not the latest version of the Storybook CLI, are you sure you want to continue?
          </Text>
        )}
      </Box>
    );
  },
  DIRECTORY: ({ state, dispatch }) => {
    useEffect(() => {
      setTimeout(() => {
        dispatch({ type: ACTIONS.DIRECTORY, payload: { path: 'my/path' } });
      }, 1000);
    }, []);

    return (
      <Box>
        <Text>...</Text>
      </Box>
    );
  },
  FRAMEWORK: ({ state, dispatch }) => {
    const [detection, setDetection] = useState<FrameworkResult>(state.framework);

    useEffect(() => {
      if (detection === 'auto') {
        checkFramework().then((result) => {
          setDetection(result);
        });
      }
    }, []);

    useInput((input, key) => {
      if (detection !== 'undetected' && detection !== 'auto' && (key.return || input === 'y')) {
        dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: detection } });
      }
      if (detection !== 'undetected' && detection !== 'auto' && input === 'n') {
        setDetection('undetected');
      }
    });

    switch (detection) {
      case 'auto':
        return (
          <Box flexDirection="column">
            <Text>- Checking for framework...</Text>
          </Box>
        );
      case 'undetected':
        return (
          <Box flexDirection="column">
            <Text>Select which framework?</Text>
            <MultiSelect
              // count={6} // I'd prefer to have this option back
              options={supportedFrameworksMap}
              setSelection={([selection]) =>
                dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: selection } })
              }
              isDisabled={false}
            />
          </Box>
        );
      default:
        return (
          <Box flexDirection="column">
            <Text>Detected framework: {detection}</Text>
            <Text>OK? y/n</Text>
          </Box>
        );
    }
  },
  INTENTS: ({ state, dispatch }) => {
    const [selection, setSelection] = useState(state.intents);

    useInput((input, key) => {
      if (key.return) {
        dispatch({ type: ACTIONS.INTENTS, payload: { list: selection } });
      }
    });

    return (
      <Box flexDirection="column">
        <Text>What are you using Storybook for?</Text>
        <MultiSelect
          // count={6} // I'd prefer to have this option back
          options={{ test: 'Testing', dev: 'Development', docs: 'Documentation' } as const}
          selection={selection}
          setSelection={(selected) => setSelection(selected)}
          isDisabled={false}
        />
      </Box>
    );
  },
  FEATURES: ({ state, dispatch }) => {
    const [selection, setSelection] = useState(state.features);

    useInput((input, key) => {
      if (key.return) {
        dispatch({ type: ACTIONS.FEATURES, payload: { list: selection } });
      }
    });

    return (
      <Box flexDirection="column">
        <Text>What optional features?</Text>
        <MultiSelect
          // count={6} // I'd prefer to have this option back
          options={
            {
              typescript: 'Generate files with TypeScript',
              onboarding: 'Onboarding',
              examples: 'Generate example stories (required for onboarding)',
              essentials: 'Add the most commonly used addons',
            } as const
          }
          selection={selection}
          setSelection={(selected) => setSelection(selected)}
          isDisabled={false}
        />
      </Box>
    );
  },
  CHECK: ({ state, dispatch }) => {
    const [compatibility, setCompatibility] = useState<CompatibilityResult>({ type: 'loading' });

    useInput((input, key) => {
      if (compatibility.type === 'incompatible') {
        if (key.return || input === 'y') {
          dispatch({ type: ACTIONS.NEXT });
        } else if (input === 'n') {
          dispatch({ type: ACTIONS.EXIT, payload: { code: 1, reasons: compatibility.reasons } });
        }
      }
    });

    useEffect(() => {
      checkCompatibility().then((result) => {
        if (result.type === 'compatible') {
          dispatch({ type: 'NEXT' });
        } else {
          setCompatibility(result);
        }
      });
    }, []);

    return (
      <Box flexDirection="column">
        {compatibility.type === 'loading' && <Text>- Checking compatibility...</Text>}
        {compatibility.type === 'incompatible' && (
          <>
            <Box flexDirection="column">
              <Text>Not compatible with current setup:</Text>
              {compatibility.reasons.map((reason, index) => (
                <Text key={index}>{reason}</Text>
              ))}
            </Box>
            <Text>Are you sure you want to continue? Y/n</Text>
          </>
        )}
      </Box>
    );
  },
  INSTALL: ({ state, dispatch }) => {
    useInput((input, key) => {
      if (key.return || input === 'y') {
        dispatch({ type: ACTIONS.INSTALL, payload: { value: true } });
      }
      if (input === 'n') {
        dispatch({ type: ACTIONS.INSTALL, payload: { value: false } });
      }
    });

    return (
      <Box>
        <Text>Shall we install dependencies? y/n</Text>
      </Box>
    );
  },
  SANDBOX: ({ state, dispatch }) => {
    const [exists, setExists] = useState<ExistsResult>('loading');

    const directory = isAbsolute(state.directory)
      ? state.directory
      : join(process.cwd(), state.directory);

    // useInput((input, key) => {
    //   if (compatibility.type === 'incompatible') {
    //     if (key.return || input === 'y') {
    //       dispatch({ type: ACTIONS.NEXT });
    //     } else if (input === 'n') {
    //       dispatch({ type: ACTIONS.EXIT, payload: { code: 1, reasons: compatibility.reasons } });
    //     }
    //   }
    // });

    useEffect(() => {
      checkExists(directory).then((result) => {
        if (result === 'exists') {
          dispatch({ type: 'NEXT' });
        } else {
          setExists(result);

          const language = state.features.includes('typescript') ? 'ts' : 'js';
          const framework = state.framework;

          // do work to actually create sandbox
        }
      });
    }, []);

    return (
      <Box flexDirection="column">
        {exists === 'loading' && <Text>- Checking if directory is empty...</Text>}
        {exists === 'empty' && <Text>- Creating project...</Text>}
      </Box>
    );
  },
  RUN: ({ state, dispatch }) => {
    const [results, setResults] = useState({
      installation: state.install ? 'loading' : 'skipped',
      config: 'loading',
    });

    const directory = isAbsolute(state.directory) ? state.directory : join(cwd(), state.directory);

    const list = Object.entries(results);
    const done = list.every(([_, status]) => status === 'done' || status === 'skipped');

    if (done) {
      return (
        <Box>
          <Text>All done!</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Text>running tasks...</Text>
        {state.install ? (
          <Installation
            state={state}
            onComplete={() => setResults((t) => ({ ...t, installation: 'done' }))}
          />
        ) : (
          <Text>skipped installation...</Text>
        )}
        <ConfigGeneration
          state={state}
          onComplete={() => setResults((t) => ({ ...t, config: 'done' }))}
        />
      </Box>
    );
  },
} satisfies Record<string, FC<{ state: State; dispatch: Dispatch<Action> }>>;

const keys = getKeys(steps);

const ACTIONS = {
  NEXT: 'NEXT',
  IGNORE_GIT: 'IGNORE_GIT',
  DIRECTORY: 'DIRECTORY',
  FRAMEWORK: 'FRAMEWORK',
  INTENTS: 'INTENTS',
  FEATURES: 'FEATURES',
  INSTALL: 'INSTALL',
  EXIT: 'EXIT',
} as const;

type Action =
  | {
      type: (typeof ACTIONS)['NEXT'];
    }
  | {
      type: (typeof ACTIONS)['IGNORE_GIT'];
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

export type State = Pick<Input, 'features' | 'intents' | 'framework'> & {
  step: keyof typeof steps;
  directory: string;

  // unsure about this one
  install: boolean | null;
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ACTIONS.NEXT:
      const current = keys.indexOf(state.step);
      const next = keys[current + 1];

      if (current === keys.length - 1) {
        // last step
        return state;
      }

      return { ...state, step: next };
    case ACTIONS.IGNORE_GIT:
      return {
        ...state,
        step: 'DIRECTORY',
      };
    case ACTIONS.DIRECTORY:
      return {
        ...state,
        directory: action.payload.path,
        step: state.framework === 'auto' ? 'FRAMEWORK' : 'INTENTS',
      };
    case ACTIONS.FRAMEWORK:
      return { ...state, framework: action.payload.id, step: 'INTENTS' };
    case ACTIONS.INTENTS:
      return { ...state, intents: action.payload.list, step: 'FEATURES' };
    case ACTIONS.FEATURES:
      return {
        ...state,
        features: action.payload.list,
        step: state.install !== null ? 'INSTALL' : 'CHECK',
      };
    case ACTIONS.INSTALL:
      return { ...state, install: action.payload.value, step: 'RUN' };
    default:
      return state;
  }
}

export function Main({
  features,
  intents,
  ignoreGitNotClean,
  directory,
  framework,
  install,
}: Input) {
  const [state, dispatch] = useReducer(reducer, {
    features,
    intents,
    directory: directory ?? '.',
    framework: framework ?? 'auto',
    install: install ?? null,
    step: ignoreGitNotClean ? 'VERSION' : 'GIT',
  });

  const Step = steps[state.step];

  return (
    <Box flexDirection="column">
      {/* Here we render the header */}
      <Box>
        <Text>Intro...</Text>
      </Box>
      <Box>
        <Text>{JSON.stringify(state, null, 2)}</Text>
      </Box>

      {/* Here we render the current step with state and dispatch */}
      <Step state={state} dispatch={dispatch} />
    </Box>
  );
}

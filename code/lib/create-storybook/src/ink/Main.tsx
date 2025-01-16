import { isAbsolute, join } from 'node:path';
import { cwd } from 'node:process';

import React, { type Dispatch, type FC, useEffect, useReducer, useState } from 'react';

import { Box, Text, useInput } from 'ink';

import { supportedFrameworksMap } from '../bin/modernInputs';
import type { Input } from './app';
import { Confirm } from './components/Confirm';
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

    useEffect(() => {
      if (state.ignoreGitNotClean) {
        dispatch({ type: ACTIONS.IGNORE_GIT });
      } else {
        checkGitStatus().then((result) => {
          if (result) {
            dispatch({ type: ACTIONS.IGNORE_GIT });
          } else {
            setGit(result);
          }
        });
      }
    }, []);

    if (state.ignoreGitNotClean) {
      return (
        <Box>
          <Text>Ignoring git state...</Text>
        </Box>
      );
    }

    return (
      <Box>
        {git === 'loading' && <Text>- Checking git state...</Text>}
        {git === 'unclean' && (
          <>
            <Text>- Git is not clean, are you sure you want to continue?</Text>
            <Confirm
              onChange={(answer) => {
                if (answer) {
                  dispatch({ type: ACTIONS.IGNORE_GIT });
                } else {
                  // TODO!
                }
              }}
            />
          </>
        )}
      </Box>
    );
  },
  VERSION: ({ state, dispatch }) => {
    const [version, setVersion] = useState<VersionResult>('loading');

    useEffect(() => {
      if (state.ignoreVersion) {
        dispatch({ type: ACTIONS.IGNORE_VERSION });
      } else {
        checkVersion().then((result) => {
          if (result === 'latest') {
            dispatch({ type: ACTIONS.IGNORE_VERSION });
          } else {
            setVersion(result);
          }
        });
      }
    }, []);

    if (state.ignoreVersion) {
      return (
        <Box>
          <Text>Ignoring version state...</Text>
        </Box>
      );
    }

    return (
      <Box>
        {version === 'loading' && <Text>- Checking version state...</Text>}
        {version === 'outdated' && (
          <>
            <Text>
              This is not the latest version of the Storybook CLI, are you sure you want to
              continue?
            </Text>
            <Confirm
              onChange={(answer) => {
                if (answer) {
                  dispatch({ type: ACTIONS.IGNORE_VERSION });
                } else {
                  // TODO!
                }
              }}
            />
          </>
        )}
      </Box>
    );
  },
  DIRECTORY: ({ state, dispatch }) => {
    const directory = isAbsolute(state.directory) ? state.directory : join(cwd(), state.directory);

    // TODO: make the input path absolute
    useEffect(() => {
      setTimeout(() => {
        dispatch({ type: ACTIONS.DIRECTORY, payload: { path: directory } });
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
      } else {
        dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: state.framework } });
      }
    }, []);

    if (state.framework !== 'auto') {
      return (
        <Box>
          <Text>Framework is set to {state.framework}</Text>
        </Box>
      );
    }

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
              selection={[]}
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
            <Text>
              OK?{' '}
              <Confirm
                onChange={(answer) => {
                  if (answer) {
                    dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: detection } });
                  } else {
                    setDetection('undetected');
                  }
                }}
              />
            </Text>
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

    useEffect(() => {
      if (selection.length) {
        dispatch({ type: ACTIONS.INTENTS, payload: { list: state.intents } });
      }
    }, []);

    if (state.intents.length) {
      return (
        <Box>
          <Text>Intents are set to {state.intents.join(', ')}</Text>
        </Box>
      );
    }

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

    useEffect(() => {
      if (selection.length) {
        dispatch({ type: ACTIONS.FEATURES, payload: { list: state.features } });
      }
    }, []);

    if (state.features.length) {
      return (
        <Box>
          <Text>Features are set to {state.features.join(', ')}</Text>
        </Box>
      );
    }

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

    useEffect(() => {
      checkCompatibility().then((result) => {
        if (result.type === 'compatible') {
          dispatch({ type: ACTIONS.NEXT });
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
            <Text>
              Are you sure you want to continue?{' '}
              <Confirm
                onChange={(answer) => {
                  if (answer) {
                    dispatch({ type: ACTIONS.NEXT });
                  } else {
                    dispatch({
                      type: ACTIONS.EXIT,
                      payload: { code: 1, reasons: compatibility.reasons },
                    });
                  }
                }}
              />
            </Text>
          </>
        )}
      </Box>
    );
  },
  INSTALL: ({ state, dispatch }) => {
    useEffect(() => {
      if (state.install !== undefined) {
        dispatch({ type: ACTIONS.INSTALL, payload: { value: state.install } });
      }
    }, []);

    if (state.install !== undefined) {
      return (
        <Box>
          <Text>Install dependencies: {state.install ? 'yes' : 'no'}</Text>
        </Box>
      );
    }

    return (
      <Box>
        <Text>
          Shall we install dependencies?{' '}
          <Confirm
            onChange={(answer) => {
              dispatch({ type: ACTIONS.INSTALL, payload: { value: answer } });
            }}
          />
        </Text>
      </Box>
    );
  },
  SANDBOX: ({ state, dispatch }) => {
    const [exists, setExists] = useState<ExistsResult>('loading');

    const directory = isAbsolute(state.directory)
      ? state.directory
      : join(process.cwd(), state.directory);

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
        <Installation
          state={state}
          dispatch={dispatch}
          doCancel={() => {}} // TODO: figure out how to deal with this
          onComplete={(errors) =>
            setResults((t) => ({ ...t, installation: errors?.length ? 'fail' : 'done' }))
          }
        />

        <ConfigGeneration
          state={state}
          dispatch={dispatch}
          doCancel={() => {}} // TODO: figure out how to deal with this
          onComplete={(errors) =>
            setResults((t) => ({ ...t, config: errors?.length ? 'fail' : 'done' }))
          }
        />
        {/* <MetricsReport /> */}
      </Box>
    );
  },
} satisfies Record<string, FC<{ state: State; dispatch: Dispatch<Action> }>>;

const keys = getKeys(steps);

const ACTIONS = {
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
};

function reducer(state: State, action: Action): State {
  const current = keys.indexOf(state.step);
  const next = current === keys.length - 1 ? keys[current + 1] : keys[current];

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
    default:
      return state;
  }
}

export function Main({ directory, framework, install, ...rest }: Input) {
  const [state, dispatch] = useReducer(reducer, {
    directory: directory ?? '.',
    framework: framework ?? 'auto',
    install: install ?? undefined,
    step: 'GIT',
    ...rest,
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

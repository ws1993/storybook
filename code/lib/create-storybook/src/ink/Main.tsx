import { dirname, isAbsolute, join } from 'node:path';
import { cwd } from 'node:process';

import React, { type Dispatch, type FC, useContext, useEffect, useReducer, useState } from 'react';

import { Spinner, TextInput } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text, useInput } from 'ink';

import { supportedFrameworksMap } from '../bin/modernInputs';
import type { Input } from './app';
import { Confirm } from './components/Confirm';
import { Rainbow } from './components/Rainbow';
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
import { AppContext } from './utils/context';
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
        {git === 'loading' && (
          <Box gap={1}>
            <Spinner />
            <Text>Checking git state...</Text>
          </Box>
        )}
        {git === 'unclean' && (
          <>
            <Box borderStyle={'round'} borderColor={'yellow'} flexDirection="column">
              <Text>{figureSet.warning} Your git is not clean!</Text>
              <Text>
                This CLI will make changes to your file-system, and reverting them those will be
                significantly easier when starting from a clean git state.
              </Text>
              <Text>
                Are you sure you want to continue?
                <Confirm
                  onChange={(answer) => {
                    if (answer) {
                      dispatch({ type: ACTIONS.IGNORE_GIT });
                    } else {
                      dispatch({
                        type: ACTIONS.EXIT,
                        payload: { code: 1, reasons: ['cancelled: unclean git'] },
                      });
                    }
                  }}
                />
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  },
  VERSION: ({ state, dispatch }) => {
    const [version, setVersion] = useState<VersionResult>('loading');

    useEffect(() => {
      checkVersion().then((result) => {
        if (state.ignoreVersion || result === 'latest') {
          dispatch({ type: ACTIONS.IGNORE_VERSION, payload: { value: 'latest' } });
        } else {
          setVersion(result);
        }
      });
    }, []);

    return (
      <Box>
        {version === 'loading' && (
          <Box gap={1}>
            <Spinner />
            <Text>Checking version state...</Text>
          </Box>
        )}
        {version === 'outdated' && (
          <>
            <Text>
              This is not the latest version of the Storybook CLI, are you sure you want to
              continue?
            </Text>
            <Confirm
              onChange={(answer) => {
                if (answer) {
                  dispatch({ type: ACTIONS.IGNORE_VERSION, payload: { value: 'outdated' } });
                } else {
                  dispatch({
                    type: ACTIONS.EXIT,
                    payload: { code: 1, reasons: ['cancelled: used outdated version'] },
                  });
                }
              }}
            />
          </>
        )}
      </Box>
    );
  },
  DIRECTORY: ({ state, dispatch }) => {
    const [accepted, setAccepted] = useState<boolean | undefined>(undefined);
    const [suggestions, setSuggestions] = useState<string[] | undefined>(undefined);

    const directory = isAbsolute(state.directory) ? state.directory : join(cwd(), state.directory);

    useEffect(() => {
      if (state.directory !== '.') {
        return dispatch({ type: ACTIONS.DIRECTORY, payload: { path: directory } });
      }
    }, []);

    const context = useContext(AppContext);

    useEffect(() => {
      if (accepted === false && context.glob && state.directory === '.') {
        context.glob
          .glob('**/package.json', {
            cwd: directory,
            absolute: true,
            ignore: ['**/node_modules/**'],
          })
          .then((results) => {
            setSuggestions(results.map((s) => dirname(s)));
          });
      }
    }, [accepted]);

    return (
      <Box flexDirection="column" gap={1}>
        {accepted === undefined && (
          <>
            <Text>Where should Storybook be added?</Text>
            <Text>
              Currently set to: <Text color={'cyan'}>"{directory}"</Text> is this correct?{' '}
              <Confirm
                onChange={(answer) => {
                  if (answer) {
                    dispatch({ type: ACTIONS.DIRECTORY, payload: { path: directory } });
                  } else {
                    setAccepted(false);
                  }
                }}
              />
            </Text>
          </>
        )}
        {accepted === false && (
          <>
            <Text>Please enter the directory</Text>
            {/* I'd like to replace this some day with a tree view */}
            <TextInput
              suggestions={suggestions}
              defaultValue={directory}
              onChange={(value) => {
                dispatch({ type: ACTIONS.DIRECTORY, payload: { path: value } });
              }}
            />
          </>
        )}
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
        <Box flexDirection="column" gap={1}>
          <Text>Storybook can work for many types of projects.</Text>
          <Text>
            You have selected this framework: <Text color="cyan">{state.framework}</Text>
          </Text>
        </Box>
      );
    }

    switch (detection) {
      case 'auto':
        return (
          <Box flexDirection="column" gap={1}>
            <Text>Storybook can work for many types of projects.</Text>
            <Box gap={1}>
              <Spinner />
              <Text>
                We're looking at your project to determine which storybook-framework is best...
              </Text>
            </Box>
          </Box>
        );
      case 'undetected':
        return (
          <Box flexDirection="column" gap={1}>
            <Text>Storybook can work for many types of projects.</Text>

            <Box flexDirection="column">
              <Text>Please select which storybook-framework applies to your project?</Text>
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
          </Box>
        );
      default:
        return (
          <Box flexDirection="column" gap={1}>
            <Text>Storybook can work for many types of projects.</Text>
            <Text>
              We looked at your project and we think the storybook-framework:{' '}
              <Text color="cyan">{detection}</Text> would work best, Is that correct?
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
      <Box flexDirection="column" gap={1}>
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
      <Box flexDirection="column" gap={1}>
        <Text>What optional features would you like to add?</Text>
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
        {compatibility.type === 'loading' && (
          <Box gap={1}>
            <Spinner />
            <Text>We're checking compatibility...</Text>
          </Box>
        )}
        {compatibility.type === 'incompatible' && (
          <Box flexDirection="column" gap={1}>
            <Box flexDirection="column" borderStyle={'round'} borderColor={'red'}>
              <Text>Not compatible with current setup:</Text>
              {compatibility.reasons.map((reason, index) => (
                <Text key={index}>{reason}</Text>
              ))}
            </Box>
            <Text>
              It's strongly recommended, to NOT proceed, and address problems listed above.
            </Text>
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
          </Box>
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

    if (state.install === true) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text>Storybook will need to add dependencies to your project.</Text>
          <Text>We will run the package manager for you.</Text>
        </Box>
      );
    }
    if (state.install === false) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text>
            You've opted not to have us run the package manager install command for you, you will
            have to add dependencies manually.
          </Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text>Storybook will need to add dependencies to your project.</Text>
        <Text>
          Shall we run the package manager install command for you?{' '}
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

          // TODO: actually download sandbox into directory
        }
      });
    }, []);

    return (
      <Box flexDirection="column" gap={1}>
        {exists === 'loading' && (
          <Box gap={1}>
            <Spinner />
            <Text>We're checking if the project needs a scaffold..</Text>
          </Box>
        )}
        {exists === 'empty' && (
          <>
            <Text>Storybook needs to scaffold project to initialize on top off.</Text>
            <Text>
              Creating a new project in the directory: <Text color="cyan">{directory}</Text>
            </Text>
          </>
        )}
      </Box>
    );
  },
  RUN: ({ state, dispatch }) => {
    const [results, setResults] = useState({
      installation: { status: state.install ? 'loading' : 'skipped', errors: [] as Error[] },
      config: { status: 'loading', errors: [] as Error[] },
    });

    const list = Object.entries(results);
    const done = list.every(([_, { status }]) => status === 'done' || status === 'skipped');
    const anyFailed = list.some(([_, { errors }]) => errors.length > 0);

    if (done) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text>
            Your storybook is <Rainbow text="ready" />
          </Text>
          <Box flexDirection="column">
            <Text>You can run your storybook with the following command:</Text>
            <Text>
              <Text color="cyan">npx sb</Text>
            </Text>
          </Box>
        </Box>
      );
    }
    if (anyFailed) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text>
            Your storybook failed to be added to your project. Please check the following errors:
          </Text>
          {list.map((e) => {
            const [name, { status, errors }] = e;
            if (errors.length === 0) {
              return null;
            }
            return (
              <Box
                key={name}
                flexDirection="column"
                borderStyle={'round'}
                borderColor={'red'}
                paddingLeft={1}
                paddingRight={1}
              >
                <Box
                  borderLeft={false}
                  borderRight={false}
                  borderTop={false}
                  borderColor={'red'}
                  borderStyle={'double'}
                >
                  <Text key={name}>
                    {name}: {status}
                    {errors.length ? ` with ${errors.length} error${errors.length > 1 && 's'}` : ''}
                  </Text>
                </Box>

                {errors.map((error, index) => (
                  <Text key={index}>{error.message}</Text>
                ))}
              </Box>
            );
          })}
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Text>running tasks...</Text>
        <Installation
          state={state}
          dispatch={dispatch}
          onComplete={(errors) =>
            setResults((t) => ({
              ...t,
              installation: { status: errors?.length ? 'fail' : 'done', errors: errors || [] },
            }))
          }
        />

        <ConfigGeneration
          state={state}
          dispatch={dispatch}
          onComplete={(errors) =>
            setResults((t) => ({
              ...t,
              config: { status: errors?.length ? 'fail' : 'done', errors: errors || [] },
            }))
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

function reducer(state: State, action: Action): State {
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
    version: undefined,
    ...rest,
  });

  const Step = steps[state.step];

  return (
    <Box flexDirection="column" gap={1}>
      {/* Here we render the header */}
      <Box flexDirection="column">
        <Box>
          <Rainbow text="Welcome to Storybook's CLI" />
        </Box>
        <Text>Let's get things set up!</Text>
      </Box>
      {/* <Box>
        <Text>{JSON.stringify(state, null, 2)}</Text>
      </Box> */}

      {/* Here we render the current step with state and dispatch */}

      <Step state={state} dispatch={dispatch} />
    </Box>
  );
}

import { dirname, isAbsolute, join } from 'node:path';
import { cwd } from 'node:process';

import React, {
  type Dispatch,
  type FC,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { Box, Text, useInput } from 'ink';

import { supportedFrameworksMap } from '../bin/modernInputs';
import type { Input } from './app';
import { MultiSelect } from './components/Select/MultiSelect';
import { AppContext } from './context';

function getKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

type GitResult = 'loading' | 'clean' | 'none' | 'unclean';
/** Check if the user has pending changes */
async function checkGitStatus(): Promise<GitResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'clean';
}

type ExistsResult = 'loading' | 'empty' | 'exists';
/** Check if the user has pending changes */
async function checkExists(location: string): Promise<ExistsResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'empty';
}

type VersionResult = 'loading' | 'latest' | 'outdated';
async function checkVersion(): Promise<VersionResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'latest';
}

type FrameworkResult = State['framework'] | 'undetected';
async function checkFramework(): Promise<FrameworkResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'ember';
}

type CompatibilityResult =
  | { type: 'loading' }
  | { type: 'compatible' }
  | { type: 'incompatible'; reasons: any[] };
async function checkCompatibility(): Promise<CompatibilityResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { type: 'compatible' };
}

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
    const [tasks, setTasks] = useState({
      installation: state.install ? 'loading' : 'skipped',
      config: 'loading',
    });

    const directory = isAbsolute(state.directory) ? state.directory : join(cwd(), state.directory);

    const list = Object.entries(tasks);
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
            onComplete={() => setTasks((t) => ({ ...t, installation: 'done' }))}
          />
        ) : (
          <Text>skipped installation...</Text>
        )}
        <ConfigGeneration
          state={state}
          onComplete={() => setTasks((t) => ({ ...t, config: 'done' }))}
        />
      </Box>
    );
  },
} satisfies Record<string, FC<{ state: State; dispatch: Dispatch<Action> }>>;

function Installation({ state, onComplete }: { state: State; onComplete: () => void }) {
  const [line, setLine] = useState<string>('');

  const context = useContext(AppContext);

  const ref = useRef<ReturnType<Exclude<typeof context.child_process, undefined>['spawn']>>();
  if (context.child_process && context.require && !ref.current) {
    // It'd be nice if this wasn't so hardcoded/odd, but we do not need to worry about finding the correct package manager
    const niCommand = join(dirname(context.require?.resolve('@antfu/ni')), '..', 'bin', 'ni.mjs');
    const child = context.child_process.spawn(`${niCommand}`, {
      shell: true,
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      const last = lines[lines.length - 1];
      setLine(last);
    });

    child.on('close', (code) => {
      setTimeout(() => {
        onComplete();
      }, 1000);
    });

    child.on('error', (err) => {
      setTimeout(() => {
        onComplete();
      }, 1000);
    });

    ref.current = child;
  }

  useEffect(() => {
    if (!context.child_process) {
      // do work to install dependencies
      const interval = setInterval(() => {
        setLine((l) => l + '.');
      }, 10);
      setTimeout(() => {
        clearInterval(interval);
        onComplete();
      }, 1000);
    }
  }, []);

  return (
    <Box height={1} overflow="hidden">
      <Text>- Installing {line === '' ? '...' : line}</Text>
    </Box>
  );
}

function ConfigGeneration({ state, onComplete }: { state: State; onComplete: () => void }) {
  const [line, setLine] = useState<string>('');

  useEffect(() => {
    // do work to install dependencies
    const interval = setInterval(() => {
      setLine((l) => l + '.');
    }, 10);
    setTimeout(() => {
      clearInterval(interval);
      onComplete();
    }, 1000);
  }, []);

  return (
    <Box height={1} overflow="hidden">
      <Text>- Generating config files {line === '' ? '...' : line}</Text>
    </Box>
  );
}

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
  OTHER: 'OTHER', // unused
} as const;

/** Proceed to next step */
interface NextAction {
  type: (typeof ACTIONS)['NEXT'];
}
/** Set the directory */
interface IgnoreGitAction {
  type: (typeof ACTIONS)['IGNORE_GIT'];
}
/** Set the directory */
interface DirectoryAction {
  type: (typeof ACTIONS)['DIRECTORY'];
  payload: { path: string };
}
/** Set the framework */
interface FrameworkAction {
  type: (typeof ACTIONS)['FRAMEWORK'];
  payload: { id: State['framework'] };
}
/** Set the intents */
interface IntentsAction {
  type: (typeof ACTIONS)['INTENTS'];
  payload: { list: State['intents'] };
}
/** Set the features */
interface FeaturesAction {
  type: (typeof ACTIONS)['FEATURES'];
  payload: { list: State['features'] };
}
/** Set the install */
interface InstallAction {
  type: (typeof ACTIONS)['INSTALL'];
  payload: { value: boolean };
}
/** Exit the app */
interface ExitAction {
  type: (typeof ACTIONS)['EXIT'];
  payload: { code: number; reasons: string[] };
}
/** Unused */
interface OtherAction {
  type: (typeof ACTIONS)['OTHER'];
  payload: { a: string };
}

type Action =
  | NextAction
  | IgnoreGitAction
  | DirectoryAction
  | FrameworkAction
  | IntentsAction
  | FeaturesAction
  | InstallAction
  | ExitAction
  | OtherAction;
type Step = keyof typeof steps;
type State = Pick<Input, 'features' | 'intents' | 'framework'> & {
  step: Step;
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

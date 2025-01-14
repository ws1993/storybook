import React, { type FC, useEffect, useReducer, useState } from 'react';

import { Box, Text, useInput } from 'ink';

import type { Input } from './app';

type GitResult = 'loading' | 'clean' | 'none' | 'unclean';

/** Check if the user has pending changes */
async function checkGitStatus(): Promise<GitResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'clean';
}

type VersionResult = 'loading' | 'latest' | 'outdated';
async function checkVersion(): Promise<VersionResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'latest';
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
    });
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
  FRAMEWORK: ({ state }) => {
    return (
      <Box>
        <Text>...</Text>
      </Box>
    );
  },
  INTENT: ({ state }) => {
    return (
      <Box>
        <Text>What are you using Storybook for?</Text>
      </Box>
    );
  },
  ADDITIONS: ({ state }) => {
    return (
      <Box>
        <Text>...</Text>
      </Box>
    );
  },
  INSTALL: ({ state }) => {
    return (
      <Box>
        <Text>...</Text>
      </Box>
    );
  },
} satisfies Record<string, FC<{ state: State; dispatch: any }>>;

const keys = getKeys(steps);
function getKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

const ACTIONS = {
  NEXT: 'NEXT',
  DIRECTORY: 'DIRECTORY',
  OTHER: 'OTHER', // unused
} as const;

/** Proceed to next step */
interface NextAction {
  type: (typeof ACTIONS)['NEXT'];
}
/** Set a directory */
interface DirectoryAction {
  type: (typeof ACTIONS)['DIRECTORY'];
  payload: { path: string };
}
/** Unused */
interface OtherAction {
  type: (typeof ACTIONS)['OTHER'];
  payload: { a: string };
}

type Action = NextAction | DirectoryAction | OtherAction;
type Step = keyof typeof steps;
type State = Pick<Input, 'features' | 'intents'> & { step: Step; directory?: string };

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
    case ACTIONS.DIRECTORY:
      return { ...state, directory: action.payload.path, step: 'FRAMEWORK' };
    default:
      return state;
  }
}

export function Main({ features, intents, ignoreGitNotClean }: Input) {
  const [state, dispatch] = useReducer(reducer, {
    features,
    intents,
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

export function Init(state: {
  name: string | string[];
  width: number;
  height: number;
}): React.ReactNode {
  const { width } = state;
  const [activePrompt, setActivePrompt] = React.useState(0);
  const [highlightedOption, setHighlightedOption] = React.useState(0);
  const [selectedOptions, setSelectedOptions] = React.useState([0]);

  const prompts = [
    {
      title: 'What would you like to use Storybook for?',
      description:
        'This indicates your general interest and will help us install the right components.',
      options: [
        { label: 'Development', hint: '(always enabled)', disabled: true, selected: true },
        { label: 'Documentation' },
        { label: 'Testing' },
      ],
    },
    { title: 'Checking your project for compatibility...' },
    {
      title: "OK. We'll install the following packages:",
      body: (
        <>
          <Box flexDirection="column">
            <Text>- @storybook/core</Text>
            <Text>- @storybook/react</Text>
            <Text>
              - storybook <Text dimColor>(CLI)</Text>
            </Text>
          </Box>
          <Text bold>Continue? Y/n</Text>
        </>
      ),
    },
  ];

  useInput((input, key) => {
    const question = prompts[activePrompt];
    if (!question) {
      return;
    }

    if (key.return) {
      setActivePrompt((prev) => prev + 1);
      setHighlightedOption(0);
    }

    const { options } = question;
    if (options && options[highlightedOption]) {
      if (key.downArrow) {
        setHighlightedOption((prev) => (prev + 1) % options.length);
      } else if (key.upArrow) {
        setHighlightedOption((prev) => (prev + 2) % options.length);
      }
      if (input === ' ' && !options[highlightedOption].disabled) {
        setSelectedOptions((prev) =>
          prev.includes(highlightedOption)
            ? prev.filter((option) => option !== highlightedOption)
            : [...prev, highlightedOption]
        );
      }
    }
  });

  return (
    <Box width={width} flexDirection="column">
      <Box paddingLeft={1}>
        <Text>Welcome to Storybook!</Text>
      </Box>

      {prompts.map(({ title, description, body, options }, promptIndex) => {
        if (promptIndex > activePrompt) {
          return null;
        }

        return (
          <Box
            key={promptIndex}
            width={'100%'}
            borderDimColor={promptIndex !== activePrompt}
            borderStyle="round"
            flexDirection="column"
            padding={1}
            paddingLeft={2}
            gap={1}
          >
            <Box flexDirection="column">
              <Text bold>{title}</Text>
              <Text dimColor>{description}</Text>
            </Box>
            {options && (
              <>
                {promptIndex === activePrompt ? (
                  <>
                    <Box flexDirection="column">
                      {options.map((option, index) => (
                        <Box gap={1} key={option.label}>
                          <Text>{highlightedOption === index ? '❯' : ' '}</Text>
                          <Text dimColor={option.disabled}>
                            {selectedOptions.includes(index) ? '◼' : '◻'}
                          </Text>
                          <Text bold={highlightedOption === index}>
                            [{index + 1}] {option.label}
                          </Text>
                          {(option.disabled || option.hint) && highlightedOption === index && (
                            <Text dimColor>{option.hint || '(disabled)'}</Text>
                          )}
                        </Box>
                      ))}
                    </Box>
                    <Box flexDirection="column">
                      <Text dimColor>Use arrow keys to highlight, space to select an item.</Text>
                      <Text dimColor>Press Enter to submit.</Text>
                    </Box>
                  </>
                ) : (
                  <Text>{selectedOptions.map((i) => options[i].label).join(', ')}</Text>
                )}
              </>
            )}
            {body}
          </Box>
        );
      })}
    </Box>
  );
}

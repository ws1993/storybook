import React, { useReducer } from 'react';

import { Box, Text } from 'ink';

import type { Input } from './app';
import { Rainbow } from './components/Rainbow';
import { steps } from './steps';
import { reducer } from './steps';

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
          <Text>Hello Yann!</Text>
          {/* <Rainbow text="Welcome to Storybook's CLI" /> */}
        </Box>
        <Text>Let's get things set up!</Text>
      </Box>
      <Box>
        <Text>{JSON.stringify(state, null, 2)}</Text>
      </Box>

      {/* Here we render the current step with state and dispatch */}

      <Step state={state} dispatch={dispatch} />
    </Box>
  );
}

import { userInfo } from 'node:os';

import React, { useReducer } from 'react';

import { Box, Text } from 'ink';

import type { Input } from './app';
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
    <Box flexDirection="column" gap={1} marginBottom={1}>
      {/* Here we render the header */}
      <Box flexDirection="column">
        <Box gap={2}>
          <Box
            borderStyle={'round'}
            borderColor={'#FF4785'}
            padding={1}
            paddingLeft={2}
            paddingRight={2}
            flexDirection="column"
            gap={1}
          >
            <Text>
              Hello {userInfo().username}, welcome to the{' '}
              <Text color="#FF4785">Storybook's CLI</Text>!
            </Text>
            <Text>Let's add storybook to your project!</Text>
          </Box>
        </Box>
      </Box>
      {/* <Box>
        <Text>{JSON.stringify(state, null, 2)}</Text>
      </Box> */}

      {/* Here we render the current step with state and dispatch */}
      <Step state={state} dispatch={dispatch} />
    </Box>
  );
}

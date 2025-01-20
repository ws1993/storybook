import React, { type Dispatch, useState } from 'react';

import { Box, Text } from 'ink';

import { type Action, type State } from '.';
import { Rainbow } from '../components/Rainbow';
import { ConfigGeneration } from '../procedures/ConfigGeneration';
import { Installation } from '../procedures/Installation';
import { Telemetry } from '../procedures/Telemetry';

export function RUN({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
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

      <Telemetry state={state} />
    </Box>
  );
}

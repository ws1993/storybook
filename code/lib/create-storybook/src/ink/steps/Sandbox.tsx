import { isAbsolute, join } from 'node:path';

import React, { type Dispatch, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';

import { type Action, type State } from '.';

export function SANDBOX({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
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
}

export type ExistsResult = 'loading' | 'empty' | 'exists';
/** Check if the user has pending changes */
export async function checkExists(location: string): Promise<ExistsResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'exists';
}

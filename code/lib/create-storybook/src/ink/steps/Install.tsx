import React, { type Dispatch, useEffect } from 'react';

import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { Confirm } from '../components/Confirm';

export function INSTALL({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
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
          You've opted not to have us run the package manager install command for you, you will have
          to add dependencies manually.
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
}

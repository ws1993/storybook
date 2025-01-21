import React, { type Dispatch, useEffect, useState } from 'react';

import { Box, Text, useInput } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { MultiSelect } from '../components/Select/MultiSelect';

export function INTENTS({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
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
}

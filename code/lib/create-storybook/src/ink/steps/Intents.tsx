import React, { type Dispatch, useEffect, useState } from 'react';

import { Box, Text, useInput } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { MultiSelect } from '../components/Select/MultiSelect';

export function INTENTS({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [selection, setSelection] = useState(
    state.intents || ['dev' as const, 'docs' as const, 'test' as const]
  );
  const [showDevRequired, setShowDevRequired] = useState(false);

  useInput((input, key) => {
    if (key.return) {
      dispatch({ type: ACTIONS.INTENTS, payload: { list: selection } });
    }
  });

  useEffect(() => {
    if (state.intents) {
      const list = [...state.intents];
      if (!state.intents.includes('dev')) {
        list.push('dev');
      }
      dispatch({ type: ACTIONS.INTENTS, payload: { list } });
    }
  }, []);

  if (state.features) {
    return (
      <Box>
        <Text>Features are set to {state.features.join(', ')}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text>What are you using Storybook for?</Text>
        {showDevRequired ? <Text color={'gray'}>The "Development" option is required.</Text> : null}
      </Box>
      <MultiSelect
        // count={6} // I'd prefer to have this option back
        options={{ test: 'Testing', dev: 'Development', docs: 'Documentation' } as const}
        selection={selection}
        setSelection={(selected) => {
          const hasDev = selected.includes('dev');
          if (!hasDev) {
            selected.push('dev');
          }
          setSelection(selected);
          setShowDevRequired(!hasDev);
        }}
        isDisabled={false}
      />
    </Box>
  );
}

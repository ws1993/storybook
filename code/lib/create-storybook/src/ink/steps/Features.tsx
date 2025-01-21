import React, { type Dispatch, useEffect, useState } from 'react';

import { Box, Text, useInput } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { MultiSelect } from '../components/Select/MultiSelect';

export function FEATURES({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
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
}

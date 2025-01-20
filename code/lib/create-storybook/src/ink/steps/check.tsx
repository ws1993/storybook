import React, { type Dispatch, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { Confirm } from '../components/Confirm';
import type { CompatibilityResult } from '../utils/checks';
import { checkCompatibility } from '../utils/checks';

export function CHECK({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [compatibility, setCompatibility] = useState<CompatibilityResult>({ type: 'loading' });

  useEffect(() => {
    checkCompatibility().then((result) => {
      if (result.type === 'compatible') {
        dispatch({ type: ACTIONS.NEXT });
      } else {
        setCompatibility(result);
      }
    });
  }, []);

  return (
    <Box flexDirection="column">
      {compatibility.type === 'loading' && (
        <Box gap={1}>
          <Spinner />
          <Text>We're checking compatibility...</Text>
        </Box>
      )}
      {compatibility.type === 'incompatible' && (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="column" borderStyle={'round'} borderColor={'red'}>
            <Text>Not compatible with current setup:</Text>
            {compatibility.reasons.map((reason, index) => (
              <Text key={index}>{reason}</Text>
            ))}
          </Box>
          <Text>It's strongly recommended, to NOT proceed, and address problems listed above.</Text>
          <Text>
            Are you sure you want to continue?{' '}
            <Confirm
              onChange={(answer) => {
                if (answer) {
                  dispatch({ type: ACTIONS.NEXT });
                } else {
                  dispatch({
                    type: ACTIONS.EXIT,
                    payload: { code: 1, reasons: compatibility.reasons },
                  });
                }
              }}
            />
          </Text>
        </Box>
      )}
    </Box>
  );
}

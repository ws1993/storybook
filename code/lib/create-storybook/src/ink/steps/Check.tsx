import React, { type Dispatch, useContext, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { Confirm } from '../components/Confirm';
import { AppContext } from '../utils/context';

export function CHECK({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [compatibility, setCompatibility] = useState<CompatibilityResult>({ type: 'loading' });

  const context = useContext(AppContext);
  useEffect(() => {
    const runCheck = context?.checkCompatibility;
    if (runCheck) {
      runCheck().then((result) => {
        if (result.type === 'compatible') {
          dispatch({ type: ACTIONS.NEXT });
        } else {
          setCompatibility(result);
        }
      });
    }
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

type CompatibilityResult =
  | { type: 'loading' }
  | { type: 'compatible' }
  | { type: 'incompatible'; reasons: any[] };
/**
 * Check if the current setup is compatible with Storybook
 *
 * @note Do not use this directly, but always via the AppContext
 */
export async function checkCompatibility(): Promise<CompatibilityResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { type: 'compatible' };
}

import React, { type Dispatch, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { Confirm } from '../components/Confirm';
import type { VersionResult } from '../utils/checks';
import { checkVersion } from '../utils/checks';

export function VERSION({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [version, setVersion] = useState<VersionResult>('loading');

  useEffect(() => {
    checkVersion().then((result) => {
      if (state.ignoreVersion || result === 'latest') {
        dispatch({ type: ACTIONS.IGNORE_VERSION, payload: { value: 'latest' } });
      } else {
        setVersion(result);
      }
    });
  }, []);

  return (
    <Box>
      {version === 'loading' && (
        <Box gap={1}>
          <Spinner />
          <Text>Checking version state...</Text>
        </Box>
      )}
      {version === 'outdated' && (
        <>
          <Text>
            This is not the latest version of the Storybook CLI, are you sure you want to continue?
          </Text>
          <Confirm
            onChange={(answer) => {
              if (answer) {
                dispatch({ type: ACTIONS.IGNORE_VERSION, payload: { value: 'outdated' } });
              } else {
                dispatch({
                  type: ACTIONS.EXIT,
                  payload: { code: 1, reasons: ['cancelled: used outdated version'] },
                });
              }
            }}
          />
        </>
      )}
    </Box>
  );
}

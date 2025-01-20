import React, { type Dispatch, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { Confirm } from '../components/Confirm';
import type { GitResult } from '../utils/checks';
import { checkGitStatus } from '../utils/checks';

export function GIT({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [git, setGit] = useState<GitResult>('loading');

  useEffect(() => {
    if (state.ignoreGitNotClean) {
      dispatch({ type: ACTIONS.IGNORE_GIT });
    } else {
      checkGitStatus().then((result) => {
        if (result) {
          dispatch({ type: ACTIONS.IGNORE_GIT });
        } else {
          setGit(result);
        }
      });
    }
  }, []);

  if (state.ignoreGitNotClean) {
    return (
      <Box>
        <Text>Ignoring git state...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {git === 'loading' && (
        <Box gap={1}>
          <Spinner />
          <Text>Checking git state...</Text>
        </Box>
      )}
      {git === 'unclean' && (
        <>
          <Box borderStyle={'round'} borderColor={'yellow'} flexDirection="column">
            <Text>{figureSet.warning} Your git is not clean!</Text>
            <Text>
              This CLI will make changes to your file-system, and reverting them those will be
              significantly easier when starting from a clean git state.
            </Text>
            <Text>
              Are you sure you want to continue?
              <Confirm
                onChange={(answer) => {
                  if (answer) {
                    dispatch({ type: ACTIONS.IGNORE_GIT });
                  } else {
                    dispatch({
                      type: ACTIONS.EXIT,
                      payload: { code: 1, reasons: ['cancelled: unclean git'] },
                    });
                  }
                }}
              />
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}

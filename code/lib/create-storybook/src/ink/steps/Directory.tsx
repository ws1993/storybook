import { dirname, isAbsolute, join } from 'node:path';
import { cwd } from 'node:process';

import React, { type Dispatch, useContext, useEffect, useState } from 'react';

import { TextInput } from '@inkjs/ui';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { Confirm } from '../components/Confirm';
import { AppContext } from '../utils/context';

export function DIRECTORY({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [accepted, setAccepted] = useState<boolean | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<string[] | undefined>(undefined);

  const directory = isAbsolute(state.directory) ? state.directory : join(cwd(), state.directory);

  useEffect(() => {
    if (state.directory !== '.') {
      return dispatch({ type: ACTIONS.DIRECTORY, payload: { path: directory } });
    }
  }, []);

  const context = useContext(AppContext);

  useEffect(() => {
    if (accepted === false && context.glob && state.directory === '.') {
      context.glob
        .glob('**/package.json', {
          cwd: directory,
          absolute: true,
          ignore: ['**/node_modules/**'],
        })
        .then((results) => {
          setSuggestions(results.map((s) => dirname(s)));
        });
    }
  }, [accepted]);

  return (
    <Box flexDirection="column" gap={1}>
      {accepted === undefined && (
        <>
          <Text>Where should Storybook be added?</Text>
          <Text>
            Currently set to: <Text color={'cyan'}>"{directory}"</Text> is this correct?{' '}
            <Confirm
              onChange={(answer) => {
                if (answer) {
                  dispatch({ type: ACTIONS.DIRECTORY, payload: { path: directory } });
                } else {
                  setAccepted(false);
                }
              }}
            />
          </Text>
        </>
      )}
      {accepted === false && (
        <>
          <Text>Please enter the directory</Text>
          {/* I'd like to replace this some day with a tree view */}
          <TextInput
            suggestions={suggestions}
            defaultValue={directory}
            onSubmit={(value) => {
              dispatch({ type: ACTIONS.DIRECTORY, payload: { path: value } });
            }}
          />
        </>
      )}
    </Box>
  );
}

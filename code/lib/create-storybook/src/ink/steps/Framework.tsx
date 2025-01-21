import React, { type Dispatch, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { supportedFrameworksMap } from '../../bin/modernInputs';
import { Confirm } from '../components/Confirm';
import { MultiSelect } from '../components/Select/MultiSelect';

export function FRAMEWORK({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [detection, setDetection] = useState<FrameworkResult>(state.framework);

  useEffect(() => {
    if (detection === 'auto') {
      checkFramework().then((result) => {
        setDetection(result);
      });
    } else {
      dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: state.framework } });
    }
  }, []);

  if (state.framework !== 'auto') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text>Storybook can work for many types of projects.</Text>
        <Text>
          You have selected this framework: <Text color="cyan">{state.framework}</Text>
        </Text>
      </Box>
    );
  }

  switch (detection) {
    case 'auto':
      return (
        <Box flexDirection="column" gap={1}>
          <Text>Storybook can work for many types of projects.</Text>
          <Box gap={1}>
            <Spinner />
            <Text>
              We're looking at your project to determine which storybook-framework is best...
            </Text>
          </Box>
        </Box>
      );
    case 'undetected':
      return (
        <Box flexDirection="column" gap={1}>
          <Text>Storybook can work for many types of projects.</Text>

          <Box flexDirection="column">
            <Text>Please select which storybook-framework applies to your project?</Text>
            <MultiSelect
              // count={6} // I'd prefer to have this option back
              selection={[]}
              options={supportedFrameworksMap}
              setSelection={([selection]) =>
                dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: selection } })
              }
              isDisabled={false}
            />
          </Box>
        </Box>
      );
    default:
      return (
        <Box flexDirection="column" gap={1}>
          <Text>Storybook can work for many types of projects.</Text>
          <Text>
            We looked at your project and we think the storybook-framework:{' '}
            <Text color="cyan">{detection}</Text> would work best, Is that correct?
            <Confirm
              onChange={(answer) => {
                if (answer) {
                  dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: detection } });
                } else {
                  setDetection('undetected');
                }
              }}
            />
          </Text>
        </Box>
      );
  }
}

type FrameworkResult = State['framework'] | 'undetected';
export async function checkFramework(): Promise<FrameworkResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'ember';
}

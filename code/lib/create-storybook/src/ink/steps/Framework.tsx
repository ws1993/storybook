import React, { type Dispatch, useEffect, useState } from 'react';

import { ProjectType, detectFrameworkPreset } from 'storybook/internal/cli';

import { Spinner } from '@inkjs/ui';
import findUp from 'find-up';
import { readFile } from 'fs/promises';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { supportedFrameworksNames } from '../../bin/modernInputs';
import { Confirm } from '../components/Confirm';
import { MultiSelect } from '../components/Select/MultiSelect';

export function FRAMEWORK({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [detection, setDetection] = useState<FrameworkResult>(state.framework);

  useEffect(() => {
    if (detection === undefined) {
      checkFramework().then((result) => {
        setDetection(result);
      });
    } else {
      dispatch({ type: ACTIONS.FRAMEWORK, payload: { id: state.framework } });
    }
  }, []);

  if (state.framework) {
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
    case undefined:
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
              options={supportedFrameworksNames}
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
export async function checkFramework(state: State): Promise<FrameworkResult> {
  const pkgLocation = await findUp('package.json', { cwd: state.directory });
  if (!pkgLocation) {
    return 'undetected';
  }

  const pkg = JSON.parse(await readFile(pkgLocation, 'utf-8'));
  // slow delay for demo effect

  const out = detectFrameworkPreset(pkg);

  if (!out) {
    return 'undetected';
  } else {
    if (out === ProjectType.WEBPACK_REACT) {
      return 'react-webpack5';
    }
    if (out === ProjectType.REACT) {
      return 'react-vite';
    }
    if (out === ProjectType.REACT_SCRIPTS) {
      return 'react-webpack5';
    }
    if (out === ProjectType.REACT_NATIVE) {
      return 'react-native';
    }
    if (out === ProjectType.ANGULAR) {
      return 'angular';
    }
    if (out === ProjectType.NEXTJS) {
      return 'nextjs';
    }
    if (out === ProjectType.EMBER) {
      return 'ember';
    }
    if (out === ProjectType.NUXT) {
      return 'nuxt';
    }
    if (out === ProjectType.REACT_NATIVE_WEB) {
      return 'react-native-web-vite';
    }
    if (out === ProjectType.QWIK) {
      return 'qwik';
    }
    if (out === ProjectType.SOLID) {
      return 'solid';
    }
    if (out === ProjectType.SVELTE) {
      return 'svelte-vite';
    }
    if (out === ProjectType.SVELTEKIT) {
      return 'sveltekit';
    }
    if (out === ProjectType.PREACT) {
      return 'preact-vite';
    }
    if (out === ProjectType.VUE3) {
      return 'vue3-vite';
    }
    if (out === ProjectType.WEB_COMPONENTS) {
      return 'web-components-vite';
    }
    if (out === ProjectType.HTML) {
      return 'html-vite';
    }
  }

  return 'undetected';
}

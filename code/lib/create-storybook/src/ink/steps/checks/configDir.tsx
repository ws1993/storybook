import React from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';

import { ACTIONS } from '..';
import { Confirm } from '../../components/Confirm';
import { type Check, CompatibilityType } from './index';

const configPath = '.storybook';

/**
 * When configDir already exists, prompt:
 *
 * - Yes -> overwrite (delete)
 * - No -> exit
 */
const name = 'configDir';
export const configDir: Check = {
  condition: async (context, state) => {
    if (context.fs && context.path) {
      return context.fs
        .stat(context.path.join(state.directory, configPath))
        .then(() => ({
          type: CompatibilityType.INCOMPATIBLE,
          reasons: ['exists'],
        }))
        .catch(() => ({ type: CompatibilityType.COMPATIBLE }));
    }
    return {
      type: CompatibilityType.INCOMPATIBLE,
      reasons: ['bad context'],
    };
  },
  render: ({ s, setter, dispatch }) => {
    switch (s.type) {
      case CompatibilityType.IGNORED: {
        return (
          <Box>
            <Text>
              {figureSet.smiley} {name}: ignored
            </Text>
          </Box>
        );
      }
      case CompatibilityType.COMPATIBLE: {
        return (
          <Box>
            <Text>
              {figureSet.tick} {name}: OK
            </Text>
          </Box>
        );
      }
      case CompatibilityType.INCOMPATIBLE: {
        return (
          <Box gap={1}>
            <Text>{figureSet.cross}</Text>
            <Text>
              The folder <Text color="yellow">{configPath}</Text> already exists. We will delete it.
              Do you want to continue?
            </Text>
            <Confirm
              onChange={(answer) => {
                if (answer) {
                  setter({ type: 'ignored' });
                } else {
                  dispatch({
                    type: ACTIONS.EXIT,
                    payload: { code: 1, reasons: s.reasons },
                  });
                }
              }}
            />
          </Box>
        );
      }
      default: {
        return (
          <Box gap={1}>
            <Spinner />
            <Text>
              {name}: Checking if <Text color={'yellow'}>{configPath}</Text> exists...
            </Text>
          </Box>
        );
      }
    }
  },
};

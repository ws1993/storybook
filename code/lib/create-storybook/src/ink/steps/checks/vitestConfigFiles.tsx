import React from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';
import { coerce, satisfies } from 'semver';

import { ACTIONS } from '..';
import { Confirm } from '../../components/Confirm';
import { type Check, CompatibilityType } from './index';

/**
 * Check if existing Vite/Vitest workspace/config file can be safaley modified, if not prompt:
 *
 * - Yes -> ignore test intent
 * - No -> exit
 */
const name = 'Vitest configuration';
export const vitestConfigFiles: Check = {
  condition: async (context, state) => {
    const { findUp } = context;
    if (findUp) {
      const reasons = [];

      const vitestConfigFile = await findUp(
        ['ts', 'js', 'tsx', 'jsx', 'cts', 'cjs', 'mts', 'mjs'].map((ext) => `vitest.config.${ext}`),
        { cwd: state.directory }
      );
      if (vitestConfigFile) {
        reasons.push(`Found an existing config file: ${vitestConfigFile}`);
      }

      const vitestWorkspaceFile = await findUp(
        ['ts', 'js', 'json'].map((ext) => `vitest.workspace.${ext}`),
        { cwd: state.directory }
      );
      if (vitestWorkspaceFile) {
        reasons.push(`Found an existing workspace file: ${vitestWorkspaceFile}`);
      }

      return reasons.length
        ? { type: CompatibilityType.INCOMPATIBLE, reasons }
        : { type: CompatibilityType.COMPATIBLE };
    }
    return {
      type: CompatibilityType.INCOMPATIBLE,
      reasons: ['findUp']
        .filter((p) => !context[p as keyof typeof context])
        .map((p) => `Missing ${p} on context`),
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
          <Box flexDirection="column">
            <Box gap={1}>
              <Text>{figureSet.cross}</Text>
              <Text>
                Cannot auto-configure Vitest. Do you want to continue without Storybook's testing
                features?
              </Text>
              <Confirm
                onChange={(answer) => {
                  if (answer) {
                    dispatch({ type: ACTIONS.IGNORE_TEST_INTENT });
                    setter({ type: CompatibilityType.IGNORED });
                  } else {
                    dispatch({
                      type: ACTIONS.EXIT,
                      payload: { code: 1, reasons: s.reasons },
                    });
                  }
                }}
              />
            </Box>
            {s.reasons.map((r) => (
              <Text key={r}>• {r}</Text>
            ))}
          </Box>
        );
      }
      default: {
        return (
          <Box gap={1}>
            <Spinner />
            <Text>{name}: Checking for compatibility...</Text>
          </Box>
        );
      }
    }
  },
};

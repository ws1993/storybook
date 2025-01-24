import React from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';
import { coerce, satisfies } from 'semver';

import { ACTIONS } from '..';
import { Confirm } from '../../components/Confirm';
import { type Check, CompatibilityType } from './index';

/**
 * Detect existing Vitest/MSW version, if mismatch prompt for ignoring test intent
 *
 * - Yes -> ignore test intent
 * - No -> exit
 */
const name = 'Vitest and MSW compatibility';
export const packageVersions: Check = {
  condition: async (context) => {
    if (context.JsPackageManagerFactory) {
      const reasons = [];
      const packageManager = context.JsPackageManagerFactory.getPackageManager();

      const vitestVersionSpecifier = await packageManager.getInstalledVersion('vitest');
      const coercedVitestVersion = vitestVersionSpecifier ? coerce(vitestVersionSpecifier) : null;
      if (coercedVitestVersion && !satisfies(coercedVitestVersion, '>=2.1.0')) {
        reasons.push(`Vitest >=2.1.0 is required, found ${coercedVitestVersion}`);
      }

      const mswVersionSpecifier = await packageManager.getInstalledVersion('msw');
      const coercedMswVersion = mswVersionSpecifier ? coerce(mswVersionSpecifier) : null;
      if (coercedMswVersion && !satisfies(coercedMswVersion, '>=2.0.0')) {
        reasons.push(`Mock Service Worker (msw) >=2.0.0 is required, found ${coercedMswVersion}`);
      }

      return reasons.length
        ? { type: CompatibilityType.INCOMPATIBLE, reasons }
        : { type: CompatibilityType.COMPATIBLE };
    }
    return {
      type: CompatibilityType.INCOMPATIBLE,
      reasons: ['Missing JsPackageManagerFactory on context'],
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
                Found incompatible packages in your project. Do you want to continue without
                Storybook's testing features?
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

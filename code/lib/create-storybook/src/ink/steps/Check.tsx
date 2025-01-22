import type { FC } from 'react';
import React, { type Dispatch, useContext, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { Confirm } from '../components/Confirm';
import { AppContext } from '../utils/context';
import { getKeys } from '../utils/getKeys';

interface Check {
  condition: (state: State) => Promise<CompatibilityResult>;
  render: FC<{
    s: CompatibilityResult;
    setter: (val: CompatibilityResult) => void;
    dispatch: Dispatch<Action>;
  }>;
}

/*
 * Checks:
 *
 * - When configDir already exists, prompt:
 *   - Yes -> overwrite (delete)
 *   - No -> exit
 * - When selecting framework nextjs & intent includes test, prompt for experimental-nextjs-vite *
 *   - Yes -> migrate
 *   - No -> ignore test intent
 * - When selecting framework that doesn't support test addon, prompt for ignoring test intent
 *   - Yes -> ignore test intent
 *   - No -> exit
 * - Detect existing Vitest/MSW version, if mismatch prompt for ignoring test intent
 *   - Yes -> ignore test intent
 *   - No -> exit
 * - Check for presence of nextjs when using @storybook/nextjs, if mismatch prompt
 *   - Yes -> continue
 *   - No -> exit
 * - Check if existing Vitest workspace file can be safaley modified, if not prompt:
 *   - Yes -> ignore test intent
 *   - No -> exit
 * - Check if existing Vite config file can be safaley modified, if not prompt:
 *   - Yes -> ignore test intent
 *   - No -> exit
 * -
 */

const checks = {
  checkA: {
    condition: async (state) => {
      return { type: 'incompatible', reasons: ['reason 1', 'reason 2'] };
    },
    render: ({ s, setter, dispatch }) => {
      switch (s.type) {
        case 'ignored': {
          return (
            <Box>
              <Text>{figureSet.smiley}</Text>
            </Box>
          );
        }
        case 'compatible': {
          return (
            <Box>
              <Text>{figureSet.tick}</Text>
            </Box>
          );
        }
        case 'incompatible': {
          return (
            <Box gap={1}>
              <Text>{figureSet.cross}</Text>
              <Text>Do you want to continue?</Text>
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
              <Text>We're checking compatibility...</Text>
            </Box>
          );
        }
      }
    },
  },
  checkB: {
    condition: async (state) => {
      return { type: 'compatible' };
    },
    render: ({ s, setter, dispatch }) => {
      switch (s.type) {
        case 'ignored': {
          return (
            <Box>
              <Text>{figureSet.smiley}</Text>
            </Box>
          );
        }
        case 'compatible': {
          return (
            <Box>
              <Text>{figureSet.tick}</Text>
            </Box>
          );
        }
        case 'incompatible': {
          return (
            <Box gap={1}>
              <Text>{figureSet.cross}</Text>
              <Text>Do you want to continue 2?</Text>
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
              <Text>We're checking compatibility...</Text>
            </Box>
          );
        }
      }
    },
  },
} satisfies Record<string, Check>;

export function CHECK({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [results, setResults] = useState(
    getKeys(checks).reduce(
      (acc, key) => ({ ...acc, [key]: { type: 'loading' as const } }),
      {} as Record<keyof typeof checks, CompatibilityResult>
    )
  );

  useEffect(() => {
    getKeys(checks).forEach((key) =>
      checks[key].condition(state).then(
        (res) => setResults((val) => ({ ...val, [key]: res })),
        (err) => setResults((val) => ({ ...val, [key]: { type: 'incompatible', reasons: [err] } }))
      )
    );
  }, []);

  useEffect(() => {
    if (Object.values(results).every((r) => r.type === 'compatible' || r.type === 'ignored')) {
      dispatch({ type: ACTIONS.NEXT });
    }
  }, [results, dispatch]);

  return (
    <Box flexDirection="column">
      {getKeys(checks).map((key, index, arr) => {
        const check = checks[key];
        const R = check.render;

        return arr.slice(0, index).some((k) => results[k].type === 'incompatible') ? null : (
          <Box key={key}>
            <R
              s={results[key]}
              setter={(val) => setResults((current) => ({ ...current, [key]: val }))}
              dispatch={dispatch}
            />
          </Box>
        );
      })}
    </Box>
  );
}

type CompatibilityResult =
  | { type: 'loading' }
  | { type: 'ignored' }
  | { type: 'compatible' }
  | { type: 'incompatible'; reasons: any[] };

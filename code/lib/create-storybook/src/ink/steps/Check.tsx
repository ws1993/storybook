import React, { type Dispatch, useContext, useEffect, useState } from 'react';

import { Box } from 'ink';

import { ACTIONS, type Action, type State } from '.';
import { AppContext } from '../utils/context';
import { getKeys } from '../utils/getKeys';
import type { CompatibilityResult } from './checks';
import { checks } from './checks';

export function CHECK({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const context = useContext(AppContext);
  const [results, setResults] = useState(
    getKeys(checks).reduce(
      (acc, key) => ({ ...acc, [key]: { type: 'loading' as const } }),
      {} as Record<keyof typeof checks, CompatibilityResult>
    )
  );

  useEffect(() => {
    getKeys(checks).forEach((key) =>
      checks[key].condition(context, state).then(
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
              state={state}
              setter={(val) => setResults((current) => ({ ...current, [key]: val }))}
              dispatch={dispatch}
            />
          </Box>
        );
      })}
    </Box>
  );
}

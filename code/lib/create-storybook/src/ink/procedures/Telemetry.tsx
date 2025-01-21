import React, { useContext, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';

import { AppContext } from '../utils/context';
import type { Procedure } from '../utils/procedure';

export function Telemetry({ state, onComplete }: Procedure) {
  const { telemetry } = useContext(AppContext);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { intents, framework, features, version, install } = state;
    telemetry?.('init', { intents, framework, features, version, install })
      .then(() => {
        onComplete();
        setDone(true);
      })
      .catch((e) => {
        onComplete([e]);
        setDone(true);
      });
  }, []);

  return (
    <Box height={1} overflow="hidden" gap={1}>
      {done ? <Text>{figureSet.tick}</Text> : <Spinner />}
      {done ? (
        <Text>Sent anonymous usage statistics</Text>
      ) : (
        <Text>Sending anonymous usage statistics...</Text>
      )}
    </Box>
  );
}

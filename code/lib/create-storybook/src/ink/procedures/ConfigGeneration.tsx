import React, { useContext, useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';

import { AppContext } from '../utils/context';
import type { Procedure } from '../utils/procedure';

export function ConfigGeneration({ state, onComplete }: Procedure) {
  const [line, setLine] = useState<string>('Generating config files');
  const [done, setDone] = useState(false);

  const context = useContext(AppContext);

  useEffect(() => {
    if (context.runConfigGeneration) {
      context.runConfigGeneration(state, setLine).then(() => {
        onComplete();
        setDone(true);
      });
    }
  }, []);

  return (
    <Box height={1} overflow="hidden" gap={1}>
      {done ? <Text>{figureSet.tick}</Text> : <Spinner />}
      <Text>{line}</Text>
    </Box>
  );
}

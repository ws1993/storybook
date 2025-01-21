import React, { useEffect, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
import { Box, Text } from 'ink';

import type { Procedure } from '../utils/procedure';

export function ConfigGeneration({ state, onComplete }: Procedure) {
  const [line, setLine] = useState<string>('...');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // do work to install dependencies
    const interval = setInterval(() => {
      setLine((l) => l + '.');
    }, 10);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete();
      setDone(true);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Box height={1} overflow="hidden" gap={1}>
      {done ? <Text>{figureSet.tick}</Text> : <Spinner />}
      {done ? <Text>Generating config files{line}</Text> : <Text>Generated config files.</Text>}
    </Box>
  );
}

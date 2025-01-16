import { clear } from 'node:console';

import React, { useEffect, useState } from 'react';

import { Box, Text } from 'ink';

import type { Procedure } from '../utils/procedure';

export function ConfigGeneration({ state, onComplete }: Procedure) {
  const [line, setLine] = useState<string>('...');

  useEffect(() => {
    // do work to install dependencies
    const interval = setInterval(() => {
      setLine((l) => l + '.');
    }, 10);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete();
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Box height={1} overflow="hidden">
      <Text>- Generating config files {line}</Text>
    </Box>
  );
}

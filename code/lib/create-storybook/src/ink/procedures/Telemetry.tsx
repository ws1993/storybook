import React, { useContext, useEffect, useState } from 'react';

import { Box, Text } from 'ink';

import type { State } from '../steps';
import { AppContext } from '../utils/context';

export function Telemetry({ state }: { state: State }) {
  const { telemetry } = useContext(AppContext);

  useEffect(() => {
    const { intents, framework, features, version, install, directory } = state;
    telemetry?.('init', { intents, framework, features, version, install, directory });
  }, []);

  return (
    <Box height={1} overflow="hidden">
      <Text>- Sending anonymous usage statistics</Text>
    </Box>
  );
}

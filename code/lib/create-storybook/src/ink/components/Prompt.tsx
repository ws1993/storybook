import React from 'react';

import { Box, Text } from 'ink';

export const Prompt = ({ active }: { active?: boolean }) => {
  const icon = active ? '◆' : '◇';
  const color = active ? 'cyanBright' : 'white';

  return (
    <Box flexDirection="column">
      <Box gap={2}>
        <Text color={color}>{icon}</Text>
        <Text>Cool</Text>
      </Box>
      <Text color={color} dimColor={!active}>
        │
      </Text>
      {active && <Text color="cyanBright">└</Text>}
    </Box>
  );
};

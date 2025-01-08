import React from 'react';

import { Box, Text } from 'ink';

export function Demo(state: {
  name: string | string[];
  width: number;
  height: number;
}): React.ReactNode {
  return (
    <Box>
      <Text>
        {state.name} - {state.width} x {state.height}
      </Text>
    </Box>
  );
}

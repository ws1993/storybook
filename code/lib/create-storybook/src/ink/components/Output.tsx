import React from 'react';

import { Box, Text } from 'ink';

export const Output = ({ logQueue }: { logQueue: string[] }) => {
  return (
    <Box
      borderStyle={'round'}
      borderColor={'#FF4785'}
      flexDirection={'column'}
      gap={1}
      padding={2}
      paddingTop={1}
      paddingBottom={1}
      width={60}
    >
      {logQueue.map((message, index) => (
        <Text key={index}>{message}</Text>
      ))}
    </Box>
  );
};

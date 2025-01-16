import React from 'react';

import { Text, useInput } from 'ink';

export function Confirm({ onChange }: { onChange: (value: boolean) => void }) {
  useInput((input, key) => {
    if (key.return || input === 'y' || input === 'Y') {
      onChange(true);
    }
    if (input === 'n' || input === 'N') {
      onChange(false);
    }
  });
  return <Text>y/n</Text>;
}

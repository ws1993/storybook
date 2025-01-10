import React from 'react';

import { Box, Text, useFocus } from 'ink';

import { MultiSelect } from './Select/MultiSelect';

type O = Record<string, string>;

export function Question<T extends O = O>({
  id,
  question,
  options,
  initial = [],
  onChange,
}: {
  id: string;
  question: string;
  options: T;
  initial?: (keyof T)[];
  onChange: (selected: (keyof T)[]) => void;
}) {
  const { isFocused } = useFocus({ id });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="#FF4785">{question}</Text>
      </Box>
      <MultiSelect<T>
        options={options}
        // count={6}
        selection={initial}
        setSelection={onChange}
        isDisabled={!isFocused}
        // onNavigate={() => {}}
      />
    </Box>
  );
}

import React from 'react';

import { Box, useInput } from 'ink';

import { MultiSelectOption } from './MultiSelectOption';

export interface Props<T extends Record<string, string>> {
  options: T;
  selection: (keyof T)[];
  setSelection: (selected: (keyof T)[]) => void;
  isDisabled: boolean;
}

export function MultiSelect<T extends Record<string, string>>({
  options,
  selection = [],
  setSelection,
  isDisabled = false,
}: Props<T>) {
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  useInput((input, key) => {
    if (isDisabled) {
      return;
    }
    if (input === ' ') {
      const focusedOption = Object.keys(options)[focusedIndex];

      if (!focusedOption) {
        return;
      }
      if (selection.includes(focusedOption)) {
        setSelection(selection.filter((v) => v !== focusedOption));
      } else {
        setSelection([...selection, focusedOption]);
      }
    } else if (key.downArrow) {
      setFocusedIndex(Math.min(focusedIndex + 1, Object.keys(options).length - 1));
    } else if (key.upArrow) {
      setFocusedIndex(Math.max(focusedIndex - 1, 0));
    }
  });

  return (
    <Box flexDirection="column">
      {Object.entries(options).map(([key, label], index) => {
        return (
          <MultiSelectOption
            key={key}
            isFocused={!isDisabled && focusedIndex === index}
            isSelected={selection.includes(key)}
          >
            {label}
          </MultiSelectOption>
        );
      })}
    </Box>
  );
}

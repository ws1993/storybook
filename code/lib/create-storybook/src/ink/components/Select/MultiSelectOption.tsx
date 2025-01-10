import React, { type ReactNode } from 'react';

import figures from 'figures';
import { Box, Text } from 'ink';

export type MultiSelectOptionProps = {
  /** Determines if option is focused. */
  readonly isFocused: boolean;

  /** Determines if option is selected. */
  readonly isSelected: boolean;

  /** Option label. */
  readonly children: ReactNode;
};

function MultiSelectOptionFigure({
  isFocused,
  isSelected,
}: {
  isFocused: boolean;
  isSelected: boolean;
}) {
  const color = isSelected ? '#90ff5c' : '#66BF3C';
  if (isFocused && !isSelected) {
    return <Text color={color}>{figures.circleDouble}</Text>;
  }
  if (isFocused && isSelected) {
    return <Text color={color}>{figures.bullet}</Text>;
  }
  if (isSelected) {
    return <Text color={color}>{figures.radioOn}</Text>;
  }

  return <Text color={color}>{figures.radioOff}</Text>;
}

export function MultiSelectOption({ isFocused, isSelected, children }: MultiSelectOptionProps) {
  const color =
    isSelected && isFocused ? '#90ff5c' : isSelected ? '#66BF3C' : isFocused ? '#FFF' : '#ddd';
  return (
    <Box>
      <MultiSelectOptionFigure isFocused={isFocused} isSelected={isSelected} />
      <Text> </Text>
      <Text bold={isFocused} color={color}>
        {children}
      </Text>
      {isFocused ? <Text color={'#888'}> {figures.arrowLeft}</Text> : null}
    </Box>
  );
}

export function MultiSelectMore({ direction, count }: { direction: 'up' | 'down'; count: number }) {
  return (
    <Box>
      <Text color={'#888'}>{figures.circleDotted}</Text>
      <Text> </Text>
      <Text color={'#888'}>
        {direction === 'up' ? figures.arrowUp : figures.arrowDown} {count} more{figures.ellipsis}
      </Text>
    </Box>
  );
}

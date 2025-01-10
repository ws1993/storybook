import React, { useEffect, useMemo } from 'react';
import { Fragment, useState } from 'react';

import { Text } from 'ink';

const RAINBOW_COLORS = [
  '#FF6F6F', // soft red
  '#FF8A66', // soft orange-red
  '#FFA366', // soft orange
  '#FFBD66', // soft golden orange
  '#FFD766', // soft yellow-orange
  '#FFEF66', // soft yellow
  '#EFFF66', // soft lime-yellow
  '#CFFF66', // soft lime-green
  '#AFFF66', // soft green
  '#8FFF99', // soft mint-green
  '#66FFD7', // soft cyan
  '#66EFFF', // soft sky-blue
  '#66D7FF', // soft light blue
  '#66BFFF', // soft blue
  '#668FFF', // soft indigo
  '#8066FF', // soft violet-blue
  '#A666FF', // soft purple
  '#C766FF', // soft magenta
  '#E066FF', // soft pink-magenta
  '#FF66D7', // soft pink
];

export function Rainbow({ text, animated = true }: { text: string; animated?: boolean }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!animated) {
      return;
    }
    const interval = setInterval(() => setOffset((o) => o + 1), 36);
    return () => clearInterval(interval);
  }, [animated]);

  const mapped = useMemo(() => {
    const characters = text.split('');

    return characters.map((c, index) => {
      const colorIndex = (index + offset) % RAINBOW_COLORS.length;
      return (
        <Text key={index} color={RAINBOW_COLORS[colorIndex]}>
          {c}
        </Text>
      );
    });
  }, [text, offset]);

  return <Fragment>{mapped}</Fragment>;
}

import { dirname, join } from 'node:path';

import React, { useContext, useEffect, useRef, useState } from 'react';

import { Box, Text } from 'ink';

import type { State } from '../Main';
import { AppContext } from '../utils/context';

export function Installation({ state, onComplete }: { state: State; onComplete: () => void }) {
  const [line, setLine] = useState<string>('');

  const context = useContext(AppContext);

  const ref = useRef<ReturnType<Exclude<typeof context.child_process, undefined>['spawn']>>();
  if (context.child_process && context.require && !ref.current) {
    // It'd be nice if this wasn't so hardcoded/odd, but we do not need to worry about finding the correct package manager
    const niCommand = join(dirname(context.require?.resolve('@antfu/ni')), '..', 'bin', 'ni.mjs');
    const child = context.child_process.spawn(`${niCommand}`, {
      shell: true,
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      const last = lines[lines.length - 1];
      setLine(last);
    });

    child.on('close', (code) => {
      setTimeout(() => {
        onComplete();
      }, 1000);
    });

    child.on('error', (err) => {
      setTimeout(() => {
        onComplete();
      }, 1000);
    });

    ref.current = child;
  }

  useEffect(() => {
    if (!context.child_process) {
      // do work to install dependencies
      const interval = setInterval(() => {
        setLine((l) => l + '.');
      }, 10);
      setTimeout(() => {
        clearInterval(interval);
        onComplete();
      }, 1000);
    }
  }, []);

  return (
    <Box height={1} overflow="hidden">
      <Text>- Installing {line === '' ? '...' : line}</Text>
    </Box>
  );
}

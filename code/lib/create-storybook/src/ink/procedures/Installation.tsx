import { on } from 'node:events';
import { dirname, join } from 'node:path';

import React, { useContext, useEffect, useState } from 'react';

import { Box, Text } from 'ink';

import { AppContext } from '../utils/context';
import type { Procedure } from '../utils/procedure';

const deriveDependencies = (state: Procedure['state']): string[] => {
  const dependencies = ['storybook', `@storybook/${state.framework}`];

  if (state.features.includes('onboarding')) {
    dependencies.push('@storybook/addon-onboarding');
  }

  if (state.features.includes('essentials')) {
    dependencies.push('@storybook/addon-essentials');
  }

  if (state.intents.includes('docs') && !state.features.includes('essentials')) {
    dependencies.push('@storybook/addon-docs');
  }

  return dependencies;
};

export function Installation({ state, onComplete }: Procedure) {
  const [line, setLine] = useState<string>('...');
  const [error, setError] = useState<string>('');
  const context = useContext(AppContext);

  useEffect(() => {
    if (state.install) {
      const dependencies = deriveDependencies(state);

      if (context.child_process && context.require) {
        // It'd be nice if this wasn't so hardcoded/odd, but we do not need to worry about finding the correct package manager
        const niCommand = join(
          dirname(context.require?.resolve('@antfu/ni')),
          '..',
          'bin',
          'ni.mjs'
        );
        const dependencyInstallCommand = `${niCommand} ${dependencies.join(' ')} -D`;
        const child = context.child_process.spawn(dependencyInstallCommand, {
          shell: true,
        });
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (data) => {
          const lines = data.toString().trim().split('\n');
          const last = lines[lines.length - 1];
          setLine(last);
        });

        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (data) => {
          setError((current) => (current + '\n' + data.toString()).trim());
          const lines = data.toString().trim().split('\n');
          const last = lines[lines.length - 1];
          setLine(last);
        });

        child.on('close', (code) => {
          setTimeout(() => {
            const errors = [new Error(`install process exited with code ${code}`)];
            if (error !== '') {
              errors.push(new Error(error));
            }
            onComplete(errors);
          }, 1000);
        });

        child.on('error', (err) => {
          setTimeout(() => {
            const errors = [err];
            if (error !== '') {
              errors.push(new Error(error));
            }
            onComplete(errors);
          }, 1000);
        });
        return () => {
          if (child.killed) {
            return;
          }
          child.kill();
          onComplete([new Error('Installation cancelled')]);
        };
      } else {
        // do work to install dependencies
        const interval = setInterval(() => {
          setLine((l) => l + '.');
        }, 10);
        const timeout = setTimeout(() => {
          clearInterval(interval);
          onComplete();
        }, 1000);

        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
          onComplete([new Error('Installation cancelled')]);
        };
      }
    } else {
      onComplete();
    }
  }, []);

  return (
    <Box height={1} overflow="hidden">
      {state.install ? <Text>- Installing {line}</Text> : <Text>- Skipped installation</Text>}
    </Box>
  );
}

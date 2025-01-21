import { dirname, join } from 'node:path';

import React, { useContext, useEffect, useRef, useState } from 'react';

import { Box, Text } from 'ink';

import versions from '../../../../../core/src/common/versions';
import { AppContext } from '../utils/context';
import type { Procedure } from '../utils/procedure';

const getExactVersioned = (name: keyof typeof versions): string => {
  return `${name}@${versions[name]}`;
};

const deriveDependencies = (state: Procedure['state']): string[] => {
  const format = state.version === 'latest' ? getExactVersioned : (name: string) => name;
  const dependencies = [
    format(`storybook`),
    format(`@storybook/${state.framework}` as keyof typeof versions),
  ];

  if (state.features.includes(`onboarding`)) {
    dependencies.push(format(`@storybook/addon-onboarding`));
  }

  if (state.features.includes(`essentials`)) {
    dependencies.push(format(`@storybook/addon-essentials`));
  }

  if (state.intents.includes(`docs`) && !state.features.includes(`essentials`)) {
    dependencies.push(format(`@storybook/addon-docs`));
  }

  return dependencies;
};

export function Installation({ state, onComplete }: Procedure) {
  const [error, setError] = useState<string>('');
  const [lastChunk, setLastChunk] = useState<string>('');
  const context = useContext(AppContext);

  const ref = useRef({
    error,
    lastChunk,
  });

  ref.current = {
    error,
    lastChunk,
  };

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
          cwd: state.directory,
        });
        // child.stdout.setEncoding('utf8');
        child.stdout.on('data', (data) => {
          const chunk = data.toString().trim();
          if (chunk !== '') {
            setLastChunk(chunk);
          }
        });

        // child.stderr.setEncoding('utf8');
        child.stderr.on('data', (data) => {
          const chunk = data.toString().trim();
          if (chunk !== '' && chunk.match(/error/i)) {
            setLastChunk(chunk);
            setError((current) => (current + '\n' + chunk).trim());
          }
        });

        child.on('close', (code) => {
          setTimeout(() => {
            const errors = [];
            if (ref.current.error !== '') {
              errors.push(new Error(ref.current.error));
            }

            if (code !== 0 && errors.length === 0) {
              errors.push(new Error(`install process exited with code ${code}`));
            }
            onComplete(errors);
          }, 1000);
        });

        child.on('error', (err) => {
          setTimeout(() => {
            const errors = [err];
            if (ref.current.error !== '') {
              errors.push(new Error(ref.current.error));
            } else if (ref.current.lastChunk !== '') {
              errors.push(new Error(ref.current.lastChunk));
            }
            onComplete(errors);
          }, 1000);
        });
        return () => {
          if (child.killed || child.exitCode !== null) {
            return;
          }
          child.kill();
          onComplete([new Error('Installation cancelled')]);
        };
      } else {
        // do work to install dependencies
        const interval = setInterval(() => {
          setLastChunk((l) => l + '.');
        }, 10);
        const timeout = setTimeout(() => {
          clearInterval(interval);
          onComplete();
        }, 1000);

        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
          onComplete();
        };
      }
    } else {
      onComplete();
    }
  }, []);

  const lines = lastChunk.split('\n');
  const line = lines[lines.length - 1];

  return (
    <Box height={1} overflow="hidden">
      {state.install ? <Text>- Installing {line}</Text> : <Text>- Skipped installation</Text>}
    </Box>
  );
}

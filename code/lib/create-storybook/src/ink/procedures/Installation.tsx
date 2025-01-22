import { dirname, join } from 'node:path';

import React, { useContext, useEffect, useRef, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import figureSet from 'figures';
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

  if (state.features.includes(`vrt`)) {
    dependencies.push('@chromatic-com/storybook@^3');
  }

  if (state.intents.includes(`docs`) && !state.features.includes(`essentials`)) {
    dependencies.push(format(`@storybook/addon-docs`));
  }

  if (state.intents.includes(`test`)) {
    dependencies.push(format(`@storybook/test`));
    dependencies.push(format(`@storybook/experimental-addon-test`));
  }

  return dependencies;
};

export function Installation({ state, onComplete }: Procedure) {
  const [error, setError] = useState<string>('');
  const [lastChunk, setLastChunk] = useState<string>('');
  const [done, setDone] = useState(false);
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
          if (chunk === '') {
            return;
          }

          setLastChunk(chunk);
          if (chunk.match(/error/i)) {
            setError((current) => (current + '\n' + chunk).trim());
          }
        });

        // child.stderr.setEncoding('utf8');
        child.stderr.on('data', (data) => {
          const chunk = data.toString().trim();
          if (
            chunk === '' ||
            chunk.match(/Corepack/i) ||
            chunk.match(/nodejs.org\/api\/packages.html#packagemanager   /i)
          ) {
            return;
          }

          setLastChunk(chunk);
          setError((current) => (current + '\n' + chunk).trim());
        });

        child.on('close', (code) => {
          const errors = [];
          if (code !== 0) {
            if (ref.current.error !== '') {
              errors.push(new Error(ref.current.error));
            }
            errors.push(new Error(`install process exited with code ${code}`));
            onComplete(errors);
          } else {
            onComplete();
          }
          setDone(true);
        });

        child.on('error', (err) => {
          const errors = [err];

          errors.push(new Error('error event'));

          onComplete(errors);
          setDone(true);
        });
        return () => {
          if (child.killed || child.exitCode !== null) {
            return;
          }
          child.kill();
          onComplete([new Error('Installation cancelled')]);
          setDone(true);
        };
      } else {
        // do work to install dependencies
        const interval = setInterval(() => {
          setLastChunk((l) => l + '.');
        }, 10);
        const timeout = setTimeout(() => {
          clearInterval(interval);
          onComplete();
          setDone(true);
        }, 1000);

        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
          onComplete();
          setDone(true);
        };
      }
    } else {
      onComplete();
    }
  }, []);

  const lines = lastChunk.split('\n');
  const line = lines[lines.length - 1];

  return (
    <Box height={1} overflow="hidden" gap={1}>
      {done ? <Text>{figureSet.tick}</Text> : <Spinner />}
      {state.install ? <Text>Installing {line}</Text> : <Text>Skipping install</Text>}
    </Box>
  );
}

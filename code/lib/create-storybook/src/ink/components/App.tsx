import React, { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

import { Box, Text, useFocusManager, useInput } from 'ink';

import { version } from '../../../package.json';
import type { Input } from '../app';
import { Question } from './Question';
import { Rainbow } from './Rainbow';

const ContentBox = ({ text, ...rest }: { text: string } & ComponentProps<typeof Box>) => {
  const lines = text.split('\n');
  return (
    <Box overflow="hidden" {...rest}>
      <Text>{lines.slice(-8).join('\n')}</Text>
    </Box>
  );
};

export function App({ width, height }: Input) {
  const { focus } = useFocusManager();
  const [content, setContent] = useState('Hello World!');

  useInput((_, key) => {
    if (key.rightArrow) {
      focus('right');
    }
    if (key.leftArrow) {
      focus('left');
    }
  });

  useEffect(() => {
    focus('left');
    setInterval(() => {
      setContent((prev) => {
        return prev + '\n' + Math.random().toString(36).slice(2, 10);
      });
    }, 1000);
  }, [focus]);

  return (
    <Box
      padding={2}
      paddingTop={1}
      paddingBottom={1}
      width={width}
      // height={height}
      flexDirection="column"
      gap={1}
    >
      <Box justifyContent="space-between" gap={1} width={'100%'}>
        <Box>
          <Rainbow text="Welcome to the Storybook CLI" />
        </Box>
        <Box flexShrink={0}>
          <Text color={'grey'}>Version </Text>
          <Rainbow text={version} />
        </Box>
      </Box>

      <Box borderColor={'#FFFF00'} borderStyle={'round'} width={'100%'}>
        <Box flexDirection="column" flexGrow={1}>
          <Text>Hello storybook team! This CLI is written with React!</Text>
          <Text>Rendering in xTermjs, within a react storybook!!!</Text>
        </Box>
        <ContentBox
          text={content}
          borderColor={'#FF00FF'}
          borderStyle={'round'}
          width={'40%'}
          height={10}
        />
      </Box>

      <Box gap={1} width={'100%'}>
        <Box flexDirection={width > 80 ? 'row' : 'column'} gap={width > 80 ? 8 : 1}>
          <Question
            key="left"
            id="left"
            question="Which renderer/framework do you use?"
            initial={['react']}
            onChange={(selected) => {
              // console.log(selected);
            }}
            options={{
              nextjs: 'NextJS',
              react: 'React',
              nuxt: 'Nuxt',
              vue: 'Vue',
              sveltekit: 'Sveltekit',
              svelte: 'Svelte',
              angular: 'Angular',
              lit: 'WebComponents',
              'react-native': 'React Native',
              server: 'Server',
            }}
          />
          <Question
            id="right"
            question="Which features interest you?"
            initial={['ct', 'a11y']}
            onChange={(selected) => {
              // console.log(selected);
            }}
            options={{
              ct: 'Component testing',
              a11y: 'Accessibility',
              vta: 'Visual regression',
              docs: 'Documentation',
              onboarding: 'Onboarding',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

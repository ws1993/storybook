import React from 'react';

import { Box, Text, useInput } from 'ink';

export function Init(state: {
  name: string | string[];
  width: number;
  height: number;
}): React.ReactNode {
  const { width } = state;
  const [activePrompt, setActivePrompt] = React.useState(0);
  const [highlightedOption, setHighlightedOption] = React.useState(0);
  const [selectedOptions, setSelectedOptions] = React.useState([0]);

  const prompts = [
    {
      title: 'What would you like to use Storybook for?',
      description:
        'This indicates your general interest and will help us install the right components.',
      options: [
        { label: 'Development', hint: '(always enabled)', disabled: true, selected: true },
        { label: 'Documentation' },
        { label: 'Testing' },
      ],
    },
    { title: 'Checking your project for compatibility...' },
    {
      title: "OK. We'll install the following packages:",
      body: (
        <>
          <Box flexDirection="column">
            <Text>- @storybook/core</Text>
            <Text>- @storybook/react</Text>
            <Text>
              - storybook <Text dimColor>(CLI)</Text>
            </Text>
          </Box>
          <Text bold>Continue? Y/n</Text>
        </>
      ),
    },
  ];

  useInput((input, key) => {
    const question = prompts[activePrompt];
    if (!question) {
      return;
    }

    if (key.return) {
      setActivePrompt((prev) => prev + 1);
      setHighlightedOption(0);
    }

    const { options } = question;
    if (options && options[highlightedOption]) {
      if (key.downArrow) {
        setHighlightedOption((prev) => (prev + 1) % options.length);
      } else if (key.upArrow) {
        setHighlightedOption((prev) => (prev + 2) % options.length);
      }
      if (input === ' ' && !options[highlightedOption].disabled) {
        setSelectedOptions((prev) =>
          prev.includes(highlightedOption)
            ? prev.filter((option) => option !== highlightedOption)
            : [...prev, highlightedOption]
        );
      }
    }
  });

  return (
    <Box width={width} flexDirection="column">
      <Box paddingLeft={1}>
        <Text>Welcome to Storybook!</Text>
      </Box>

      {prompts.map(({ title, description, body, options }, promptIndex) => {
        if (promptIndex > activePrompt) {
          return null;
        }

        return (
          <Box
            key={promptIndex}
            width={'100%'}
            borderDimColor={promptIndex !== activePrompt}
            borderStyle="round"
            flexDirection="column"
            padding={1}
            paddingLeft={2}
            gap={1}
          >
            <Box flexDirection="column">
              <Text bold>{title}</Text>
              <Text dimColor>{description}</Text>
            </Box>
            {options && (
              <>
                {promptIndex === activePrompt ? (
                  <>
                    <Box flexDirection="column">
                      {options.map((option, index) => (
                        <Box gap={1} key={option.label}>
                          <Text>{highlightedOption === index ? '❯' : ' '}</Text>
                          <Text dimColor={option.disabled}>
                            {selectedOptions.includes(index) ? '◼' : '◻'}
                          </Text>
                          <Text bold={highlightedOption === index}>
                            [{index + 1}] {option.label}
                          </Text>
                          {(option.disabled || option.hint) && highlightedOption === index && (
                            <Text dimColor>{option.hint || '(disabled)'}</Text>
                          )}
                        </Box>
                      ))}
                    </Box>
                    <Box flexDirection="column">
                      <Text dimColor>Use arrow keys to highlight, space to select an item.</Text>
                      <Text dimColor>Press Enter to submit.</Text>
                    </Box>
                  </>
                ) : (
                  <Text>{selectedOptions.map((i) => options[i].label).join(', ')}</Text>
                )}
              </>
            )}
            {body}
          </Box>
        );
      })}
    </Box>
  );
}

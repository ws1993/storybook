// import React from 'react';
// import { Spinner } from '@inkjs/ui';
// import figureSet from 'figures';
// import { Box, Text } from 'ink';
// import { ACTIONS } from '..';
import type { Framework } from '../../../bin/modernInputs';
import { supportedFrameworksNames } from '../../../bin/modernInputs';
// import { Confirm } from '../../components/Confirm';
import { type Check, CompatibilityType } from './index';

const FOUND_NEXTJS = `Found Next.js with test intent`;

export const SUPPORTED_FRAMEWORKS: Framework[] = [
  'react-vite',
  'vue3-vite',
  'html-vite',
  'preact-vite',
  'svelte-vite',
  'web-components-vite',
  'nextjs',
  'experimental-nextjs-vite',
  'sveltekit',
];

/**
 * When selecting framework nextjs & intent includes test, prompt for experimental-nextjs-vite. When
 * selecting another framework that doesn't support test addon, prompt for ignoring test intent.
 */
const name = 'Framework test compatibility';
export const frameworkTest: Check = {
  condition: async (context, state) => {
    if (
      !state.intents ||
      !state.intents.includes('test') ||
      SUPPORTED_FRAMEWORKS.includes(state.framework)
    ) {
      return { type: CompatibilityType.COMPATIBLE };
    }
    return {
      type: CompatibilityType.INCOMPATIBLE,
      reasons:
        state.framework === 'nextjs'
          ? [FOUND_NEXTJS]
          : [`Found ${supportedFrameworksNames[state.framework]} with test intent`],
    };
  },
  // render: ({ s, state, setter, dispatch }) => {
  //   switch (s.type) {
  //     case CompatibilityType.IGNORED: {
  //       return (
  //         <Box>
  //           <Text>
  //             {figureSet.smiley} {name}: ignored
  //           </Text>
  //         </Box>
  //       );
  //     }
  //     case CompatibilityType.COMPATIBLE: {
  //       return (
  //         <Box>
  //           <Text>
  //             {figureSet.tick} {name}: OK
  //           </Text>
  //         </Box>
  //       );
  //     }
  //     case CompatibilityType.INCOMPATIBLE: {
  //       return (
  //         <Box flexDirection="column">
  //           <Box gap={1}>
  //             {s.reasons.includes(FOUND_NEXTJS) ? (
  //               <Text>
  //                 {figureSet.cross} We detected or you selected Next.js and intend to use Storybook
  //                 for testing. For compatbility with Storybook's testing features, we require{' '}
  //                 {supportedFrameworksNames['experimental-nextjs-vite']}{' '}
  //                 ('experimental-nextjs-vite'). Would you like to use this instead?{' '}
  //                 <Confirm
  //                   onChange={(answer) => {
  //                     if (answer) {
  //                       dispatch({
  //                         type: ACTIONS.SET_FRAMEWORK,
  //                         payload: { id: 'experimental-nextjs-vite' },
  //                       });
  //                       setter({ type: CompatibilityType.COMPATIBLE });
  //                     } else {
  //                       dispatch({ type: ACTIONS.IGNORE_TEST_INTENT });
  //                       setter({ type: CompatibilityType.IGNORED });
  //                     }
  //                   }}
  //                 />
  //               </Text>
  //             ) : (
  //               <Text>
  //                 {figureSet.cross} We detected or you selected the{' '}
  //                 {supportedFrameworksNames[state.framework]} framework and intend to use Storybook
  //                 for testing. This framework is not currently compatible with Storybook's testing
  //                 features. Would you like to continue without testing features?
  //                 <Confirm
  //                   onChange={(answer) => {
  //                     if (answer) {
  //                       dispatch({ type: ACTIONS.IGNORE_TEST_INTENT });
  //                       setter({ type: CompatibilityType.IGNORED });
  //                     } else {
  //                       dispatch({
  //                         type: ACTIONS.EXIT,
  //                         payload: { code: 1, reasons: s.reasons },
  //                       });
  //                     }
  //                   }}
  //                 />
  //               </Text>
  //             )}
  //           </Box>
  //           <Text>Yes: Continue with experimental-nextjs-vite</Text>
  //           <Text>No: Do not include testing related packages</Text>
  //         </Box>
  //       );
  //     }
  //     default: {
  //       return (
  //         <Box gap={1}>
  //           <Spinner />
  //           <Text>{name}: Checking...</Text>
  //         </Box>
  //       );
  //     }
  //   }
  // },
};

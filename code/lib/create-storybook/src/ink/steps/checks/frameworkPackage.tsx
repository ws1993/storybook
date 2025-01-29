// import React from 'react';
// import { Spinner } from '@inkjs/ui';
// import figureSet from 'figures';
// import { Box, Text } from 'ink';
// import { coerce, satisfies } from 'semver';
// import { ACTIONS } from '..';
// import { Confirm } from '../../components/Confirm';
import { type Check, CompatibilityType } from './index';

/**
 * Check for presence of nextjs when using @storybook/nextjs, prompt if there's a mismatch
 *
 * - Yes -> continue
 * - No -> exit
 */
const name = 'Framework package';
export const frameworkPackage: Check = {
  condition: async (context, state) => {
    if (state.framework !== 'nextjs') {
      return { type: CompatibilityType.COMPATIBLE };
    }
    if (context.JsPackageManagerFactory) {
      const packageManager = context.JsPackageManagerFactory.getPackageManager();
      const nextJsVersionSpecifier = await packageManager.getInstalledVersion('next');

      return nextJsVersionSpecifier
        ? { type: CompatibilityType.COMPATIBLE }
        : { type: CompatibilityType.INCOMPATIBLE, reasons: ['Missing nextjs dependency'] };
    }
    return {
      type: CompatibilityType.INCOMPATIBLE,
      reasons: ['Missing JsPackageManagerFactory on context'],
    };
  },
  // render: ({ s, setter, dispatch }) => {
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
  //             <Text>{figureSet.cross}</Text>
  //             <Text>
  //               You have selected the Next.js framework but don't appear to have 'next' installed.
  //               Continue anyway?
  //             </Text>
  //             <Confirm
  //               onChange={(answer) => {
  //                 if (answer) {
  //                   setter({ type: CompatibilityType.IGNORED });
  //                 } else {
  //                   dispatch({
  //                     type: ACTIONS.EXIT,
  //                     payload: { code: 1, reasons: s.reasons },
  //                   });
  //                 }
  //               }}
  //             />
  //           </Box>
  //           {s.reasons.map((r) => (
  //             <Text key={r}>• {r}</Text>
  //           ))}
  //         </Box>
  //       );
  //     }
  //     default: {
  //       return (
  //         <Box gap={1}>
  //           <Spinner />
  //           <Text>{name}: Checking for compatibility...</Text>
  //         </Box>
  //       );
  //     }
  //   }
  // },
};

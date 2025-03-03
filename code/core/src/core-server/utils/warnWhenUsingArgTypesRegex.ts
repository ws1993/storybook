import { readFile } from 'node:fs/promises';

import { type BabelFile, core } from 'storybook/internal/babel';
import { babelParse } from 'storybook/internal/csf-tools';
import type { StorybookConfig } from 'storybook/internal/types';

import picocolors from 'picocolors';
import { dedent } from 'ts-dedent';

export async function warnWhenUsingArgTypesRegex(
  previewConfigPath: string | undefined,
  config: StorybookConfig
) {
  const previewContent = previewConfigPath
    ? await readFile(previewConfigPath, { encoding: 'utf8' })
    : '';

  const hasVisualTestAddon =
    config?.addons?.some((it) =>
      typeof it === 'string'
        ? it === '@chromatic-com/storybook'
        : it.name === '@chromatic-com/storybook'
    ) ?? false;

  if (hasVisualTestAddon && previewConfigPath && previewContent.includes('argTypesRegex')) {
    // @ts-expect-error File is not yet exposed, see https://github.com/babel/babel/issues/11350#issuecomment-644118606
    const file: BabelFile = new core.File(
      { filename: previewConfigPath },
      { code: previewContent, ast: babelParse(previewContent) }
    );

    file.path.traverse({
      Identifier: (path) => {
        if (path.node.name === 'argTypesRegex') {
          const message = dedent`
            ${picocolors.bold('Attention')}: We've detected that you're using ${picocolors.cyan(
              'actions.argTypesRegex'
            )} together with the visual test addon:
            
            ${path.buildCodeFrameError(previewConfigPath).message}
            
            We recommend removing the ${picocolors.cyan(
              'argTypesRegex'
            )} and assigning explicit action with the ${picocolors.cyan(
              'fn'
            )} function from ${picocolors.cyan('@storybook/test')} instead:
            https://storybook.js.org/docs/essentials/actions#via-storybooktest-fn-spy-function
            
            The build used by the addon for snapshot testing doesn't take the regex into account, which can cause hard to debug problems when a snapshot depends on the presence of action props.
          `;
          console.warn(message);
        }
      },
    });
  }
}

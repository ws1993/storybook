import { logger } from 'storybook/internal/client-logger';
import { isExportStory, isStory } from 'storybook/internal/csf';
import type { ComponentTitle, Parameters, Path, Renderer } from 'storybook/internal/types';
import type {
  CSFFile,
  ModuleExports,
  NormalizedComponentAnnotations,
} from 'storybook/internal/types';

import { normalizeComponentAnnotations } from './normalizeComponentAnnotations';
import { normalizeStory } from './normalizeStory';

const checkGlobals = (parameters: Parameters) => {
  const { globals, globalTypes } = parameters;
  if (globals || globalTypes) {
    logger.error(
      'Global args/argTypes can only be set globally',
      JSON.stringify({
        globals,
        globalTypes,
      })
    );
  }
};

const checkStorySort = (parameters: Parameters) => {
  const { options } = parameters;

  if (options?.storySort) {
    logger.error('The storySort option parameter can only be set globally');
  }
};

const checkDisallowedParameters = (parameters?: Parameters) => {
  if (!parameters) {
    return;
  }

  checkGlobals(parameters);
  checkStorySort(parameters);
};

// Given the raw exports of a CSF file, check and normalize it.
export function processCSFFile<TRenderer extends Renderer>(
  moduleExports: ModuleExports,
  importPath: Path,
  title: ComponentTitle
): CSFFile<TRenderer> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { default: defaultExport, __namedExportsOrder, ...namedExports } = moduleExports;

  const firstStory = Object.values(namedExports)[0];
  if (isStory<TRenderer>(firstStory)) {
    const meta: NormalizedComponentAnnotations<TRenderer> =
      normalizeComponentAnnotations<TRenderer>(firstStory.meta.input, title, importPath);
    checkDisallowedParameters(meta.parameters);

    const csfFile: CSFFile<TRenderer> = { meta, stories: {}, moduleExports };

    Object.keys(namedExports).forEach((key) => {
      if (isExportStory(key, meta)) {
        const storyMeta = normalizeStory(key, namedExports[key].input, meta);
        checkDisallowedParameters(storyMeta.parameters);

        csfFile.stories[storyMeta.id] = storyMeta;
      }
    });

    csfFile.projectAnnotations = firstStory.meta.preview.composed;

    return csfFile;
  }

  const meta: NormalizedComponentAnnotations<TRenderer> = normalizeComponentAnnotations<TRenderer>(
    defaultExport,
    title,
    importPath
  );
  checkDisallowedParameters(meta.parameters);

  const csfFile: CSFFile<TRenderer> = { meta, stories: {}, moduleExports };

  Object.keys(namedExports).forEach((key) => {
    if (isExportStory(key, meta)) {
      const storyMeta = normalizeStory(key, namedExports[key], meta);
      checkDisallowedParameters(storyMeta.parameters);

      csfFile.stories[storyMeta.id] = storyMeta;
    }
  });

  return csfFile;
}

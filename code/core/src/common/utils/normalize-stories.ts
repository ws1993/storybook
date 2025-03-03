import { lstatSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';

import { InvalidStoriesEntryError } from 'storybook/internal/server-errors';
import type { NormalizedStoriesSpecifier, StoriesEntry } from 'storybook/internal/types';

import * as pico from 'picomatch';
import slash from 'slash';

import { globToRegexp } from './glob-to-regexp';
import { normalizeStoryPath } from './paths';

const DEFAULT_TITLE_PREFIX = '';
const DEFAULT_FILES_PATTERN = '**/*.@(mdx|stories.@(js|jsx|mjs|ts|tsx))';

const isDirectory = (configDir: string, entry: string) => {
  try {
    return lstatSync(resolve(configDir, entry)).isDirectory();
  } catch (err) {
    return false;
  }
};

export const getDirectoryFromWorkingDir = ({
  configDir,
  workingDir,
  directory,
}: NormalizeOptions & { directory: string }) => {
  const directoryFromConfig = resolve(configDir, directory);
  const directoryFromWorking = relative(workingDir, directoryFromConfig);

  // relative('/foo', '/foo/src') => 'src'
  // but we want `./src` to match importPaths
  return normalizeStoryPath(directoryFromWorking);
};

export const normalizeStoriesEntry = (
  entry: StoriesEntry,
  { configDir, workingDir, defaultFilesPattern = DEFAULT_FILES_PATTERN }: NormalizeOptions
): NormalizedStoriesSpecifier => {
  let specifierWithoutMatcher: Omit<NormalizedStoriesSpecifier, 'importPathMatcher'>;

  if (typeof entry === 'string') {
    const globResult = pico.scan(entry);
    if (globResult.isGlob) {
      const directory = globResult.prefix + globResult.base;
      const files = globResult.glob;

      specifierWithoutMatcher = {
        titlePrefix: DEFAULT_TITLE_PREFIX,
        directory,
        files,
      };
    } else if (isDirectory(configDir, entry)) {
      specifierWithoutMatcher = {
        titlePrefix: DEFAULT_TITLE_PREFIX,
        directory: entry,
        files: defaultFilesPattern,
      };
    } else {
      specifierWithoutMatcher = {
        titlePrefix: DEFAULT_TITLE_PREFIX,
        directory: dirname(entry),
        files: basename(entry),
      };
    }
  } else {
    specifierWithoutMatcher = {
      titlePrefix: DEFAULT_TITLE_PREFIX,
      files: defaultFilesPattern,
      ...entry,
    };
  }

  // We are going to be doing everything with node importPaths which use
  // URL format, i.e. `/` as a separator, so let's make sure we've normalized
  const files = slash(specifierWithoutMatcher.files);

  // At this stage `directory` is relative to `main.js` (the config dir)
  // We want to work relative to the working dir, so we transform it here.
  const { directory: directoryRelativeToConfig } = specifierWithoutMatcher;

  const directory = slash(
    getDirectoryFromWorkingDir({
      configDir,
      workingDir,
      directory: directoryRelativeToConfig,
    })
  ).replace(/\/$/, '');

  // Now make the importFn matcher.
  const importPathMatcher = globToRegexp(`${directory}/${files}`);

  return {
    ...specifierWithoutMatcher,
    directory,
    importPathMatcher,
  };
};

interface NormalizeOptions {
  configDir: string;
  workingDir: string;
  defaultFilesPattern?: string;
}

export const normalizeStories = (entries: StoriesEntry[], options: NormalizeOptions) => {
  if (!entries || (Array.isArray(entries) && entries.length === 0)) {
    throw new InvalidStoriesEntryError();
  }

  return entries.map((entry) => normalizeStoriesEntry(entry, options));
};

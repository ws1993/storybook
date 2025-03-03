import { join, sep } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { findUpSync } from 'find-up';
import slash from 'slash';

import { getProjectRoot, normalizeStoryPath } from '../paths';

vi.mock('find-up');

describe('paths - normalizeStoryPath()', () => {
  it('returns a path starting with "./" unchanged', () => {
    const filename = `.${sep}${join('src', 'Comp.story.js')}`;
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('returns a path starting with "../" unchanged', () => {
    const filename = join('..', 'src', 'Comp.story.js');
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('returns a path equal to "." unchanged', () => {
    const filename = '.';
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('returns a path equal to ".." unchanged', () => {
    const filename = '..';
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('adds "./" to a normalized relative path', () => {
    const filename = join('src', 'Comp.story.js');
    expect(normalizeStoryPath(filename)).toEqual(`.${sep}${filename}`);
  });

  it('adds "./" to a hidden folder', () => {
    const filename = join('.storybook', 'Comp.story.js');
    expect(normalizeStoryPath(filename)).toEqual(`.${sep}${filename}`);
  });

  it('adds "./" to a hidden file', () => {
    const filename = `.Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`.${sep}${filename}`);
  });
});

describe('getProjectRoot', () => {
  it('should return the root directory containing a .git directory', () => {
    vi.mocked(findUpSync).mockImplementation((name) =>
      name === ('.git' as any) ? '/path/to/root' : undefined
    );

    expect(slash(getProjectRoot())).toBe('/path/to');
  });

  it('should return the root directory containing a .svn directory if there is no .git directory', () => {
    vi.mocked(findUpSync).mockImplementation((name) =>
      name === ('.svn' as any) ? '/path/to/root' : undefined
    );

    expect(slash(getProjectRoot())).toBe('/path/to');
  });

  it('should return the root directory containing a .yarn directory if there is no .git or .svn directory', () => {
    vi.mocked(findUpSync).mockImplementation((name) =>
      name === ('.yarn' as any) ? '/path/to/root' : undefined
    );

    expect(slash(getProjectRoot())).toBe('/path/to');
  });
});

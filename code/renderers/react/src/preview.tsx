import type { ComponentType } from 'react';

import type {
  Args,
  ComponentAnnotations,
  Meta,
  Preview,
  Story,
  StoryAnnotations,
} from 'storybook/internal/types';
import { definePreview as definePreviewBase } from 'storybook/internal/types';

import type { ArgsStoryFn } from '@storybook/csf';

import type { AddMocks } from 'src/public-types';
import type { Exact, SetOptional } from 'type-fest';

import * as reactAnnotations from './entry-preview';
import * as reactDocsAnnotations from './entry-preview-docs';
import type { ReactRenderer } from './types';

export function definePreview(preview: ReactPreview['input']) {
  return definePreviewBase({
    ...preview,
    addons: [reactAnnotations, reactDocsAnnotations, ...(preview.addons ?? [])],
  }) as ReactPreview;
}

export interface ReactPreview extends Preview<ReactRenderer> {
  meta<TArgs extends Args, TMetaArgs extends Exact<Partial<TArgs>, TMetaArgs>>(
    meta: {
      render?: ArgsStoryFn<ReactRenderer, TArgs>;
      component?: ComponentType<TArgs>;
      args?: TMetaArgs;
    } & ComponentAnnotations<ReactRenderer, TArgs>
  ): ReactMeta<{ args: TArgs }, { args: TMetaArgs }>;
}

interface ReactMeta<
  Context extends { args: Args },
  MetaInput extends ComponentAnnotations<ReactRenderer>,
> extends Meta<ReactRenderer, Context['args']> {
  story(
    story: StoryAnnotations<
      ReactRenderer,
      // TODO: infer mocks from story itself as well
      AddMocks<Context['args'], MetaInput['args']>,
      SetOptional<Context['args'], keyof Context['args'] & keyof MetaInput['args']>
    >
  ): ReactStory;
}

interface ReactStory extends Story<ReactRenderer> {}

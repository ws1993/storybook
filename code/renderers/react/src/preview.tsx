import type { ComponentProps, ComponentType } from 'react';

import { composeConfigs } from 'storybook/internal/preview-api';
import { normalizeProjectAnnotations } from 'storybook/internal/preview-api';
import type {
  Args,
  ComponentAnnotations,
  NormalizedProjectAnnotations,
  ProjectAnnotations,
  Renderer,
  StoryAnnotations,
} from 'storybook/internal/types';

import type { SetOptional } from 'type-fest';

import * as reactAnnotations from './entry-preview';
import * as reactDocsAnnotations from './entry-preview-docs';
import type { ReactRenderer } from './types';

export function definePreview(config: PreviewConfigData<ReactRenderer>) {
  return new PreviewConfig({
    ...config,
    addons: [reactAnnotations, reactDocsAnnotations, ...(config.addons ?? [])],
  });
}

interface PreviewConfigData<TRenderer extends Renderer> extends ProjectAnnotations<TRenderer> {
  addons?: ProjectAnnotations<TRenderer>[];
}

class PreviewConfig<TRenderer extends Renderer> {
  readonly annotations: NormalizedProjectAnnotations<TRenderer>;

  constructor(data: PreviewConfigData<TRenderer>) {
    const { addons, ...rest } = data;
    this.annotations = normalizeProjectAnnotations(composeConfigs([...(addons ?? []), rest]));
  }

  readonly meta = <
    TComponent extends ComponentType<any>,
    TMetaArgs extends Partial<ComponentProps<TComponent>>,
  >(
    meta: ComponentAnnotations<TRenderer, any> & { component: TComponent; args: TMetaArgs }
  ) => {
    return new Meta<TRenderer, ComponentProps<TComponent>, TMetaArgs>(meta, this);
  };

  readonly isCSFFactoryPreview = true;
}

class Meta<TRenderer extends Renderer, TArgs extends Args, TRequiredArgs extends Args> {
  readonly annotations: ComponentAnnotations<TRenderer, TArgs>;

  readonly config: PreviewConfig<TRenderer>;

  constructor(annotations: ComponentAnnotations<TRenderer, any>, config: PreviewConfig<TRenderer>) {
    this.annotations = annotations;
    this.config = config;
  }

  readonly story = (
    story: StoryAnnotations<TRenderer, TArgs, SetOptional<TArgs, keyof TArgs & keyof TRequiredArgs>>
  ) => new Story(story as any, this, this.config);
}

class Story<TRenderer extends Renderer, TArgs extends Args, TRequiredArgs extends Args> {
  constructor(
    public annotations: StoryAnnotations<TRenderer, TArgs>,
    public meta: Meta<TRenderer, TArgs, TRequiredArgs>,
    public config: PreviewConfig<TRenderer>
  ) {}

  readonly isCSFFactory = true;
}

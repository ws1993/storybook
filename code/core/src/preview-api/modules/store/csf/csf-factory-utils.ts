/* eslint-disable @typescript-eslint/naming-convention */

/* eslint-disable no-underscore-dangle */
import type {
  Args,
  ComponentAnnotations,
  LegacyStoryAnnotationsOrFn,
  ModuleExports,
  ProjectAnnotations,
  Renderer,
  StoryAnnotations,
} from '@storybook/types';

export function getCsfFactoryPreview(preview: ModuleExports): ProjectAnnotations<any> | null {
  return Object.values(preview).find(isCsfFactory) ?? null;
}

export function isCsfFactory(target: StoryAnnotations | ProjectAnnotations<any>) {
  return (
    target != null &&
    typeof target === 'object' &&
    ('isCSFFactory' in target || 'isCSFFactoryPreview' in target)
  );
}

export function getCsfFactoryAnnotations<
  TRenderer extends Renderer = Renderer,
  TArgs extends Args = Args,
>(
  story: LegacyStoryAnnotationsOrFn<TRenderer>,
  meta?: ComponentAnnotations<TRenderer, TArgs>,
  projectAnnotations?: ProjectAnnotations<TRenderer>
) {
  const _isCsfFactory = isCsfFactory(story);

  return {
    // TODO: @kasperpeulen will fix this once csf factory types are defined
    story: _isCsfFactory ? (story as any)?.input : story,
    meta: _isCsfFactory ? (story as any)?.meta?.input : meta,
    preview: _isCsfFactory ? (story as any)?.config?.input : projectAnnotations,
  };
}

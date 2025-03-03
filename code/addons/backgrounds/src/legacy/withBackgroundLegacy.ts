import { useEffect, useMemo } from 'storybook/internal/preview-api';
import type { DecoratorFunction } from 'storybook/internal/types';

import { PARAM_KEY as BACKGROUNDS_PARAM_KEY } from '../constants';
import { addBackgroundStyle, clearStyles, isReduceMotionEnabled } from '../utils';
import { getBackgroundColorByName } from './getBackgroundColorByName';

export const withBackground: DecoratorFunction = (StoryFn, context) => {
  const { globals, parameters } = context;
  const globalsBackgroundColor = globals[BACKGROUNDS_PARAM_KEY]?.value;
  const backgroundsConfig = parameters[BACKGROUNDS_PARAM_KEY];

  const selectedBackgroundColor = useMemo(() => {
    if (backgroundsConfig.disable) {
      return 'transparent';
    }

    return getBackgroundColorByName(
      globalsBackgroundColor,
      backgroundsConfig.values,
      backgroundsConfig.default
    );
  }, [backgroundsConfig, globalsBackgroundColor]);

  const isActive = useMemo(
    () => selectedBackgroundColor && selectedBackgroundColor !== 'transparent',
    [selectedBackgroundColor]
  );

  const selector =
    context.viewMode === 'docs' ? `#anchor--${context.id} .docs-story` : '.sb-show-main';

  const backgroundStyles = useMemo(() => {
    const transitionStyle = 'transition: background-color 0.3s;';
    return `
      ${selector} {
        background: ${selectedBackgroundColor} !important;
        ${isReduceMotionEnabled() ? '' : transitionStyle}
      }
    `;
  }, [selectedBackgroundColor, selector]);

  useEffect(() => {
    const selectorId =
      context.viewMode === 'docs'
        ? `addon-backgrounds-docs-${context.id}`
        : `addon-backgrounds-color`;

    if (!isActive) {
      clearStyles(selectorId);
      return;
    }

    addBackgroundStyle(
      selectorId,
      backgroundStyles,
      context.viewMode === 'docs' ? context.id : null
    );
  }, [isActive, backgroundStyles, context]);

  return StoryFn();
};

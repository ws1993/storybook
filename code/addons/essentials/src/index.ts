import { composeConfigs, definePreview } from 'storybook/internal/preview-api';

import actionsAddon from '@storybook/addon-actions';
import backgroundsAddon from '@storybook/addon-backgrounds';
import docsAddon from '@storybook/addon-docs';
import highlightAddon from '@storybook/addon-highlight';
import measureAddon from '@storybook/addon-measure';
import outlineAddon from '@storybook/addon-outline';
import viewportAddon from '@storybook/addon-viewport';

export default () =>
  definePreview(
    composeConfigs([
      actionsAddon(),
      docsAddon(),
      backgroundsAddon(),
      viewportAddon(),
      measureAddon(),
      outlineAddon(),
      highlightAddon(),
    ])
  );

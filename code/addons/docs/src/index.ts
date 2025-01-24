import { definePreview } from 'storybook/internal/preview-api';

import * as addonAnnotations from './preview';

export * from '@storybook/blocks';
export { DocsRenderer } from './DocsRenderer';

export default () => definePreview(addonAnnotations);

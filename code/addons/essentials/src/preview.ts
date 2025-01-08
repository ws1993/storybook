// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/* eslint-disable import/namespace */
import { composeConfigs } from 'storybook/internal/preview-api';

import * as actions from '@storybook/addon-actions/preview';
import * as backgrounds from '@storybook/addon-backgrounds/preview';
import * as docs from '@storybook/addon-docs/preview';
import * as highlight from '@storybook/addon-highlight/preview';
import * as measure from '@storybook/addon-measure/preview';
import * as outline from '@storybook/addon-outline/preview';
import * as viewport from '@storybook/addon-viewport/preview';

export default composeConfigs([actions, docs, backgrounds, viewport, measure, outline, highlight]);

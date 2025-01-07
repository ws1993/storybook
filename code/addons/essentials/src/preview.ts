/* eslint-disable import/namespace */
import { composeConfigs } from 'storybook/internal/preview-api';

import * as actions from './actions/preview';
import * as backgrounds from './backgrounds/preview';
import * as docs from './docs/preview';
import * as highlight from './highlight/preview';
import * as measure from './measure/preview';
import * as outline from './outline/preview';
import * as viewport from './viewport/preview';

export default composeConfigs([actions, docs, backgrounds, viewport, measure, outline, highlight]);

import { styled } from 'storybook/internal/theming';

import { headerCommon, withReset } from '../lib/common';

export const H5 = styled.h5(withReset, headerCommon, ({ theme }) => ({
  fontSize: `${theme.typography.size.s2}px`,
}));

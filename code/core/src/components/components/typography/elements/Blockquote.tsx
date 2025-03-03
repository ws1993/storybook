import { styled } from 'storybook/internal/theming';

import { withMargin, withReset } from '../lib/common';

export const Blockquote = styled.blockquote(withReset, withMargin, ({ theme }) => ({
  borderLeft: `4px solid ${theme.color.medium}`,
  padding: '0 15px',
  color: theme.color.dark,
  '& > :first-of-type': {
    marginTop: 0,
  },
  '& > :last-child': {
    marginBottom: 0,
  },
}));

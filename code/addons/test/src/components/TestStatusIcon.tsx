import { styled } from 'storybook/internal/theming';

export const TestStatusIcon = styled.div<{
  status: 'pending' | 'positive' | 'warning' | 'negative' | 'critical' | 'unknown';
  percentage?: number;
}>(
  ({ percentage }) => ({
    width: percentage ? 12 : 6,
    height: percentage ? 12 : 6,
    margin: percentage ? 1 : 4,
    background: percentage
      ? `conic-gradient(var(--status-color) ${percentage}%, var(--status-background) ${percentage + 1}%)`
      : 'var(--status-color)',
    borderRadius: '50%',
  }),
  ({ status, theme }) =>
    status === 'pending' && {
      animation: `${theme.animation.glow} 1.5s ease-in-out infinite`,
      '--status-color': theme.color.mediumdark,
      '--status-background': `${theme.color.mediumdark}66`,
    },
  ({ status, theme }) =>
    status === 'positive' && {
      '--status-color': theme.color.positive,
      '--status-background': `${theme.color.positive}66`,
    },
  ({ status, theme }) =>
    status === 'warning' && {
      '--status-color': theme.color.gold,
      '--status-background': `${theme.color.gold}66`,
    },
  ({ status, theme }) =>
    status === 'negative' && {
      '--status-color': theme.color.negative,
      '--status-background': `${theme.color.negative}66`,
    },
  ({ status, theme }) =>
    status === 'critical' && {
      '--status-color': theme.color.defaultText,
      '--status-background': `${theme.color.defaultText}66`,
    },
  ({ status, theme }) =>
    status === 'unknown' && {
      '--status-color': theme.color.mediumdark,
      '--status-background': `${theme.color.mediumdark}66`,
    }
);

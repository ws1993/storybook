import React from 'react';

import { Button, ProgressSpinner, TooltipNote, WithTooltip } from 'storybook/internal/components';
import type { TestProviders } from 'storybook/internal/core-events';
import { useStorybookApi } from 'storybook/internal/manager-api';
import { styled } from 'storybook/internal/theming';

import { EyeIcon, PlayHollowIcon, StopAltIcon } from '@storybook/icons';

const Container = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 2px',
});

const Info = styled.div({
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 6,
});

const Actions = styled.div({
  display: 'flex',
  gap: 6,
});

const TitleWrapper = styled.div<{ crashed?: boolean }>(({ crashed, theme }) => ({
  fontSize: theme.typography.size.s1,
  fontWeight: crashed ? 'bold' : 'normal',
  color: crashed ? theme.color.negativeText : theme.color.defaultText,
}));

const DescriptionWrapper = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s1,
  color: theme.textMutedColor,
}));

const Progress = styled(ProgressSpinner)({
  margin: 2,
});

const StopIcon = styled(StopAltIcon)({
  width: 10,
});

export const LegacyRender = ({ ...state }: TestProviders[keyof TestProviders]) => {
  const Description = state.description!;
  const Title = state.title!;
  const api = useStorybookApi();

  return (
    <Container>
      <Info>
        <TitleWrapper crashed={state.crashed} id="testing-module-title">
          <Title {...state} />
        </TitleWrapper>
        <DescriptionWrapper id="testing-module-description">
          <Description {...state} />
        </DescriptionWrapper>
      </Info>

      <Actions>
        {state.runnable && (
          <>
            {state.running && state.cancellable ? (
              <WithTooltip
                hasChrome={false}
                trigger="hover"
                tooltip={<TooltipNote note={`Stop ${state.name}`} />}
              >
                <Button
                  aria-label={`Stop ${state.name}`}
                  variant="ghost"
                  padding="none"
                  onClick={() => api.cancelTestProvider(state.id)}
                  disabled={state.cancelling}
                >
                  <Progress
                    percentage={
                      state.progress?.percentageCompleted ??
                      (state.details as any)?.buildProgressPercentage
                    }
                  >
                    <StopIcon />
                  </Progress>
                </Button>
              </WithTooltip>
            ) : (
              <WithTooltip
                hasChrome={false}
                trigger="hover"
                tooltip={<TooltipNote note={`Start ${state.name}`} />}
              >
                <Button
                  aria-label={`Start ${state.name}`}
                  variant="ghost"
                  padding="small"
                  onClick={() => api.runTestProvider(state.id)}
                  disabled={state.crashed || state.running}
                >
                  <PlayHollowIcon />
                </Button>
              </WithTooltip>
            )}
          </>
        )}
      </Actions>
    </Container>
  );
};

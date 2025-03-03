import React, { useState } from 'react';

import { AddonPanel } from 'storybook/internal/components';
import type { Combo } from 'storybook/internal/manager-api';
import { Consumer, addons, types } from 'storybook/internal/manager-api';
import {
  type API_StatusObject,
  type API_StatusValue,
  type Addon_TestProviderType,
  Addon_TypesEnum,
} from 'storybook/internal/types';

import { store } from '#manager-store';

import { GlobalErrorContext, GlobalErrorModal } from './components/GlobalErrorModal';
import { Panel } from './components/Panel';
import { PanelTitle } from './components/PanelTitle';
import { TestProviderRender } from './components/TestProviderRender';
import { ADDON_ID, type Details, PANEL_ID, TEST_PROVIDER_ID } from './constants';
import type { TestStatus } from './node/reporter';

const statusMap: Record<TestStatus, API_StatusValue> = {
  failed: 'error',
  passed: 'success',
  pending: 'pending',
  warning: 'warn',
  skipped: 'unknown',
};

addons.register(ADDON_ID, (api) => {
  const storybookBuilder = (globalThis as any).STORYBOOK_BUILDER || '';
  if (storybookBuilder.includes('vite')) {
    const openTestsPanel = () => {
      api.setSelectedPanel(PANEL_ID);
      api.togglePanel(true);
    };

    addons.add(TEST_PROVIDER_ID, {
      type: Addon_TypesEnum.experimental_TEST_PROVIDER,
      runnable: true,
      name: 'Component tests',
      // @ts-expect-error: TODO: Fix types
      render: (state) => {
        const [isModalOpen, setModalOpen] = useState(false);
        return (
          <GlobalErrorContext.Provider
            value={{ error: state.error?.message, isModalOpen, setModalOpen }}
          >
            <TestProviderRender api={api} state={state} />
            <GlobalErrorModal
              onRerun={() => {
                setModalOpen(false);
                api.runTestProvider(TEST_PROVIDER_ID);
              }}
            />
          </GlobalErrorContext.Provider>
        );
      },

      // @ts-expect-error: TODO: Fix types
      sidebarContextMenu: ({ context, state }) => {
        if (context.type === 'docs') {
          return null;
        }
        if (context.type === 'story' && !context.tags.includes('test')) {
          return null;
        }
        return (
          <TestProviderRender
            api={api}
            state={state}
            entryId={context.id}
            style={{ minWidth: 240 }}
          />
        );
      },

      // @ts-expect-error: TODO: Fix types
      stateUpdater: (state, update) => {
        const updated = {
          ...state,
          ...update,
          details: { ...state.details, ...update.details },
        };

        if ((!state.running && update.running) || store.getState().watching) {
          // Clear coverage data when starting test run or enabling watch mode
          delete updated.details.coverageSummary;
        }

        if (update.details?.testResults) {
          (async () => {
            await api.experimental_updateStatus(
              TEST_PROVIDER_ID,
              Object.fromEntries(
                // @ts-expect-error: TODO: Fix types
                update.details.testResults.flatMap((testResult) =>
                  testResult.results
                    .filter(({ storyId }) => storyId)
                    .map(({ storyId, status, testRunId, ...rest }) => [
                      storyId,
                      {
                        title: 'Component tests',
                        status: statusMap[status],
                        description:
                          'failureMessages' in rest && rest.failureMessages
                            ? rest.failureMessages.join('\n')
                            : '',
                        data: { testRunId },
                        onClick: openTestsPanel,
                        sidebarContextMenu: false,
                      } satisfies API_StatusObject,
                    ])
                )
              )
            );

            await api.experimental_updateStatus(
              'storybook/addon-a11y/test-provider',
              Object.fromEntries(
                // @ts-expect-error: TODO: Fix types
                update.details.testResults.flatMap((testResult) =>
                  testResult.results
                    .filter(({ storyId }) => storyId)
                    .map(({ storyId, testRunId, reports }) => {
                      const a11yReport = reports.find((r: any) => r.type === 'a11y');
                      return [
                        storyId,
                        a11yReport
                          ? ({
                              title: 'Accessibility tests',
                              description: '',
                              status: statusMap[a11yReport.status],
                              data: { testRunId },
                              onClick: () => {
                                api.setSelectedPanel('storybook/a11y/panel');
                                api.togglePanel(true);
                              },
                              sidebarContextMenu: false,
                            } satisfies API_StatusObject)
                          : null,
                      ];
                    })
                )
              )
            );
          })();
        }

        return updated;
      },
    } satisfies Omit<Addon_TestProviderType<Details>, 'id'>);
  }

  const filter = ({ state }: Combo) => {
    return {
      storyId: state.storyId,
    };
  };

  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: () => <PanelTitle />,
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => {
      return (
        <AddonPanel active={!!active}>
          <Consumer filter={filter}>{({ storyId }) => <Panel storyId={storyId} />}</Consumer>
        </AddonPanel>
      );
    },
  });
});

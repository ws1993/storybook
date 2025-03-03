import React, { useMemo } from 'react';

import type { Combo, StoriesHash } from 'storybook/internal/manager-api';
import { Consumer } from 'storybook/internal/manager-api';
import { Addon_TypesEnum } from 'storybook/internal/types';

import type { SidebarProps as SidebarComponentProps } from '../components/sidebar/Sidebar';
import { Sidebar as SidebarComponent } from '../components/sidebar/Sidebar';
import { useMenu } from './Menu';

export type Item = StoriesHash[keyof StoriesHash];

interface SidebarProps {
  onMenuClick?: SidebarComponentProps['onMenuClick'];
}

const Sidebar = React.memo(function Sideber({ onMenuClick }: SidebarProps) {
  const mapper = ({ state, api }: Combo) => {
    const {
      ui: { name, url, enableShortcuts },
      viewMode,
      storyId,
      refId,
      layout: { showToolbar },
      // FIXME: This is the actual `index.json` index where the `index` below
      // is actually the stories hash. We should fix this up and make it consistent.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      internal_index,
      filteredIndex: index,
      status,
      indexError,
      previewInitialized,
      refs,
    } = state;

    const menu = useMenu(
      state,
      api,
      showToolbar,
      api.getIsFullscreen(),
      api.getIsPanelShown(),
      api.getIsNavShown(),
      enableShortcuts
    );

    const whatsNewNotificationsEnabled =
      state.whatsNewData?.status === 'SUCCESS' && !state.disableWhatsNewNotifications;

    const topItems = api.getElements(Addon_TypesEnum.experimental_SIDEBAR_TOP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const top = useMemo(() => Object.values(topItems), [Object.keys(topItems).join('')]);

    return {
      title: name,
      url,
      indexJson: internal_index,
      index,
      indexError,
      status,
      previewInitialized,
      refs,
      storyId,
      refId,
      viewMode,
      menu,
      menuHighlighted: whatsNewNotificationsEnabled && api.isWhatsNewUnread(),
      enableShortcuts,
      extra: top,
    };
  };

  return (
    <Consumer filter={mapper}>
      {(fromState) => {
        return <SidebarComponent {...fromState} onMenuClick={onMenuClick} />;
      }}
    </Consumer>
  );
});

export default Sidebar;

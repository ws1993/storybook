import type { ComponentProps, FC, SyntheticEvent } from 'react';
import React, { useMemo, useState } from 'react';

import { TooltipLinkList, WithTooltip } from 'storybook/internal/components';
import { type TestProviders } from 'storybook/internal/core-events';
import { useStorybookState } from 'storybook/internal/manager-api';
import type { API } from 'storybook/internal/manager-api';
import { styled } from 'storybook/internal/theming';
import { type API_HashEntry, Addon_TypesEnum } from 'storybook/internal/types';

import { EllipsisIcon } from '@storybook/icons';

import type { Link } from '../../../components/components/tooltip/TooltipLinkList';
import { StatusButton } from './StatusButton';
import type { ExcludesNull } from './Tree';

const empty = {
  onMouseEnter: () => {},
  node: null,
};

const PositionedWithTooltip = styled(WithTooltip)({
  position: 'absolute',
  right: 0,
  zIndex: 1,
});

const FloatingStatusButton = styled(StatusButton)({
  background: 'var(--tree-node-background-hover)',
  boxShadow: '0 0 5px 5px var(--tree-node-background-hover)',
});

export const useContextMenu = (context: API_HashEntry, links: Link[], api: API) => {
  const [hoverCount, setHoverCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handlers = useMemo(() => {
    return {
      onMouseEnter: () => {
        setHoverCount((c) => c + 1);
      },
      onOpen: (event: SyntheticEvent) => {
        event.stopPropagation();
        setIsOpen(true);
      },
      onClose: () => {
        setIsOpen(false);
      },
    };
  }, []);

  /**
   * Calculate the providerLinks whenever the user mouses over the container. We use an incrementor,
   * instead of a simple boolean to ensure that the links are recalculated
   */
  const providerLinks = useMemo(() => {
    const testProviders = api.getElements(
      Addon_TypesEnum.experimental_TEST_PROVIDER
    ) as any as TestProviders;

    if (hoverCount) {
      return generateTestProviderLinks(testProviders, context);
    }
    return [];
  }, [api, context, hoverCount]);

  const isRendered = providerLinks.length > 0 || links.length > 0;

  return useMemo(() => {
    // Never show the SidebarContextMenu in production
    if (globalThis.CONFIG_TYPE !== 'DEVELOPMENT') {
      return empty;
    }

    return {
      onMouseEnter: handlers.onMouseEnter,
      node: isRendered ? (
        <PositionedWithTooltip
          data-displayed={isOpen ? 'on' : 'off'}
          closeOnOutsideClick
          placement="bottom-end"
          data-testid="context-menu"
          onVisibleChange={(visible) => {
            if (!visible) {
              handlers.onClose();
            } else {
              setIsOpen(true);
            }
          }}
          tooltip={<LiveContextMenu context={context} links={links} />}
        >
          <FloatingStatusButton type="button" status={'pending'}>
            <EllipsisIcon />
          </FloatingStatusButton>
        </PositionedWithTooltip>
      ) : null,
    };
  }, [context, handlers, isOpen, isRendered, links]);
};

/**
 * This component re-subscribes to storybook's core state, hence the Live prefix. It is used to
 * render the context menu for the sidebar. it self is a tooltip link list that renders the links
 * provided to it. In addition to the links, it also renders the test providers.
 */
const LiveContextMenu: FC<{ context: API_HashEntry } & ComponentProps<typeof TooltipLinkList>> = ({
  context,
  links,
  ...rest
}) => {
  const { testProviders } = useStorybookState();
  const providerLinks: Link[] = generateTestProviderLinks(testProviders, context);
  const groups = Array.isArray(links[0]) ? (links as Link[][]) : [links as Link[]];
  const all = groups.concat([providerLinks]);

  return <TooltipLinkList {...rest} links={all} />;
};

export function generateTestProviderLinks(
  testProviders: TestProviders,
  context: API_HashEntry
): Link[] {
  return Object.entries(testProviders)
    .map(([testProviderId, state]) => {
      if (!state) {
        return null;
      }
      const content = state.sidebarContextMenu?.({ context, state });

      if (!content) {
        return null;
      }

      return {
        id: testProviderId,
        content,
      };
    })
    .filter(Boolean as any as ExcludesNull);
}

/// <reference path="../typings.d.ts" />
import { global } from '@storybook/global';

import { UniversalStore } from '../shared/universal-store';
import { Channel } from './main';
import { PostMessageTransport } from './postmessage';
import type { ChannelTransport, Config } from './types';
import { WebsocketTransport } from './websocket';

const { CONFIG_TYPE } = global;

export * from './main';

export default Channel;

export { PostMessageTransport } from './postmessage';
export { WebsocketTransport, HEARTBEAT_INTERVAL, HEARTBEAT_MAX_LATENCY } from './websocket';

type Options = Config & {
  extraTransports?: ChannelTransport[];
};

/**
 * Creates a new browser channel instance.
 *
 * @param {Options} options - The options object.
 * @param {Page} options.page - Page identifier.
 * @param {ChannelTransport[]} [options.extraTransports=[]] - An optional array of extra channel
 *   transports. Default is `[]`
 * @returns {Channel} - The new channel instance.
 */
export function createBrowserChannel({ page, extraTransports = [] }: Options): Channel {
  const transports: ChannelTransport[] = [new PostMessageTransport({ page }), ...extraTransports];

  if (CONFIG_TYPE === 'DEVELOPMENT') {
    const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
    const { hostname, port } = window.location;
    const channelUrl = `${protocol}://${hostname}:${port}/storybook-server-channel`;

    transports.push(new WebsocketTransport({ url: channelUrl, onError: () => {}, page }));
  }

  const channel = new Channel({ transports });
  // eslint-disable-next-line no-underscore-dangle
  UniversalStore.__prepare(
    channel,
    page === 'manager' ? UniversalStore.Environment.MANAGER : UniversalStore.Environment.PREVIEW
  );

  return channel;
}

export type { Listener, ChannelEvent, ChannelTransport, ChannelHandler } from './types';

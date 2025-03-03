/* eslint-disable no-underscore-dangle */
import { writeFile } from 'node:fs/promises';

import type { Channel } from 'storybook/internal/channels';
import { findConfigFile, loadMainConfig } from 'storybook/internal/common';
import type { WhatsNewCache, WhatsNewData } from 'storybook/internal/core-events';
import {
  REQUEST_WHATS_NEW_DATA,
  RESULT_WHATS_NEW_DATA,
  SET_WHATS_NEW_CACHE,
  TELEMETRY_ERROR,
  TOGGLE_WHATS_NEW_NOTIFICATIONS,
} from 'storybook/internal/core-events';
import { printConfig, readConfig } from 'storybook/internal/csf-tools';
import { logger } from 'storybook/internal/node-logger';
import { telemetry } from 'storybook/internal/telemetry';
import type { CoreConfig, Options } from 'storybook/internal/types';

import invariant from 'tiny-invariant';

import { sendTelemetryError } from '../withTelemetry';

export type OptionsWithRequiredCache = Exclude<Options, 'cache'> & Required<Pick<Options, 'cache'>>;

// Grabbed from the implementation: https://github.com/storybookjs/dx-functions/blob/main/netlify/functions/whats-new.ts
export type WhatsNewResponse = {
  title: string;
  url: string;
  blogUrl?: string;
  publishedAt: string;
  excerpt: string;
};

const WHATS_NEW_CACHE = 'whats-new-cache';
const WHATS_NEW_URL = 'https://storybook.js.org/whats-new/v1';

export function initializeWhatsNew(
  channel: Channel,
  options: OptionsWithRequiredCache,
  coreOptions: CoreConfig
) {
  channel.on(SET_WHATS_NEW_CACHE, async (data: WhatsNewCache) => {
    const cache: WhatsNewCache = await options.cache.get(WHATS_NEW_CACHE).catch((e) => {
      logger.verbose(e);
      return {};
    });
    await options.cache.set(WHATS_NEW_CACHE, { ...cache, ...data });
  });

  channel.on(REQUEST_WHATS_NEW_DATA, async () => {
    try {
      const post = (await fetch(WHATS_NEW_URL).then(async (response) => {
        if (response.ok) {
          return response.json();
        }

        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw response;
      })) as WhatsNewResponse;

      const main = await loadMainConfig({ configDir: options.configDir, noCache: true });
      const disableWhatsNewNotifications =
        (main.core as CoreConfig)?.disableWhatsNewNotifications === true;

      const cache: WhatsNewCache = (await options.cache.get(WHATS_NEW_CACHE)) ?? {};
      const data = {
        ...post,
        status: 'SUCCESS',
        postIsRead: post.url === cache.lastReadPost,
        showNotification: post.url !== cache.lastDismissedPost && post.url !== cache.lastReadPost,
        disableWhatsNewNotifications,
      } satisfies WhatsNewData;
      channel.emit(RESULT_WHATS_NEW_DATA, { data });
    } catch (e) {
      logger.verbose(e instanceof Error ? e.message : String(e));
      channel.emit(RESULT_WHATS_NEW_DATA, {
        data: { status: 'ERROR' } satisfies WhatsNewData,
      });
    }
  });

  channel.on(
    TOGGLE_WHATS_NEW_NOTIFICATIONS,
    async ({ disableWhatsNewNotifications }: { disableWhatsNewNotifications: boolean }) => {
      const isTelemetryEnabled = coreOptions.disableTelemetry !== true;
      try {
        const mainPath = findConfigFile('main', options.configDir);
        invariant(mainPath, `unable to find Storybook main file in ${options.configDir}`);
        const main = await readConfig(mainPath);
        if (!main._exportsObject) {
          // eslint-disable-next-line local-rules/no-uncategorized-errors
          throw new Error(
            `Unable to parse Storybook main file while trying to read 'core' property`
          );
        }
        main.setFieldValue(['core', 'disableWhatsNewNotifications'], disableWhatsNewNotifications);
        await writeFile(mainPath, printConfig(main).code);
        if (isTelemetryEnabled) {
          await telemetry('core-config', { disableWhatsNewNotifications });
        }
      } catch (error) {
        invariant(error instanceof Error);
        if (isTelemetryEnabled) {
          await sendTelemetryError(error, 'core-config', {
            cliOptions: options,
            presetOptions: { ...options, corePresets: [], overridePresets: [] },
            skipPrompt: true,
          });
        }
      }
    }
  );

  channel.on(TELEMETRY_ERROR, async (error) => {
    const isTelemetryEnabled = coreOptions.disableTelemetry !== true;

    if (isTelemetryEnabled) {
      await sendTelemetryError(error, 'browser', {
        cliOptions: options,
        presetOptions: { ...options, corePresets: [], overridePresets: [] },
        skipPrompt: true,
      });
    }
  });
}

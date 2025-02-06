import type { Channel } from 'storybook/internal/channels';
import {
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST,
  TESTING_MODULE_PROGRESS_REPORT,
  TESTING_MODULE_RUN_REQUEST,
  TESTING_MODULE_WATCH_MODE_REQUEST,
  type TestingModuleCancelTestRunRequestPayload,
  type TestingModuleProgressReportPayload,
  type TestingModuleRunRequestPayload,
  type TestingModuleWatchModeRequestPayload,
} from 'storybook/internal/core-events';

import { TEST_PROVIDER_ID, type UniversalStoreState } from '../constants';
import type { universalStore } from '../universal-store/vitest-process';
import { VitestManager } from './vitest-manager';

export class TestManager {
  vitestManager: VitestManager;

  universalStore: typeof universalStore | undefined;

  config = {
    watchMode: false,
  };

  constructor(
    private channel: Channel,
    private options: {
      onError?: (message: string, error: Error) => void;
      onReady?: () => void;
    } = {}
  ) {
    this.vitestManager = new VitestManager(this);

    this.channel.on(TESTING_MODULE_RUN_REQUEST, this.handleRunRequest.bind(this));
    this.channel.on(TESTING_MODULE_WATCH_MODE_REQUEST, this.handleWatchModeRequest.bind(this));
    this.channel.on(TESTING_MODULE_CANCEL_TEST_RUN_REQUEST, this.handleCancelRequest.bind(this));

    this.vitestManager
      .startVitest()
      .then(() => options.onReady?.())
      .then(async () => {
        const { universalStore } = await import('../universal-store/vitest-process');
        this.universalStore = universalStore;
        universalStore.onStateChange((state, previousState) => {
          this.handleConfigChange(state.config, previousState.config);
        });
      });
  }

  async handleConfigChange(
    config: UniversalStoreState['config'],
    previousConfig: UniversalStoreState['config']
  ) {
    process.env.VITEST_STORYBOOK_CONFIG = JSON.stringify(config);

    if (config.coverage !== previousConfig.coverage) {
      try {
        await this.vitestManager.restartVitest({
          coverage: config.coverage,
        });
      } catch (e) {
        this.reportFatalError('Failed to change coverage configuration', e);
      }
    }
  }

  async handleWatchModeRequest(payload: TestingModuleWatchModeRequestPayload) {
    if (payload.providerId !== TEST_PROVIDER_ID) {
      return;
    }
    this.config.watchMode = payload.watchMode;

    const coverage = this.universalStore?.getState().config.coverage ?? false;

    if (coverage) {
      try {
        if (payload.watchMode) {
          // if watch mode is toggled on and coverage is already enabled, restart vitest without coverage to automatically disable it
          await this.vitestManager.restartVitest({ coverage: false });
        } else {
          // if watch mode is toggled off and coverage is already enabled, restart vitest with coverage to automatically re-enable it
          await this.vitestManager.restartVitest({ coverage });
        }
      } catch (e) {
        this.reportFatalError('Failed to change watch mode while coverage was enabled', e);
      }
    }
  }

  async handleRunRequest(payload: TestingModuleRunRequestPayload) {
    try {
      if (payload.providerId !== TEST_PROVIDER_ID) {
        return;
      }

      const coverage = this.universalStore?.getState().config.coverage ?? false;

      /*
        If we're only running a subset of stories, we have to temporarily disable coverage,
        as a coverage report for a subset of stories is not useful.
      */
      const temporarilyDisableCoverage =
        coverage && !this.config.watchMode && (payload.storyIds ?? []).length > 0;
      if (temporarilyDisableCoverage) {
        await this.vitestManager.restartVitest({
          coverage: false,
        });
      } else {
        await this.vitestManager.vitestRestartPromise;
      }

      await this.vitestManager.runTests(payload);

      if (temporarilyDisableCoverage) {
        // Re-enable coverage if it was temporarily disabled because of a subset of stories was run
        await this.vitestManager.restartVitest({ coverage });
      }
    } catch (e) {
      this.reportFatalError('Failed to run tests', e);
    }
  }

  async handleCancelRequest(payload: TestingModuleCancelTestRunRequestPayload) {
    try {
      if (payload.providerId !== TEST_PROVIDER_ID) {
        return;
      }

      await this.vitestManager.cancelCurrentRun();
    } catch (e) {
      this.reportFatalError('Failed to cancel tests', e);
    }
  }

  async sendProgressReport(payload: TestingModuleProgressReportPayload) {
    this.channel.emit(TESTING_MODULE_PROGRESS_REPORT, payload);
  }

  async reportFatalError(message: string, error: Error | any) {
    this.options.onError?.(message, error);
  }

  static async start(channel: Channel, options: typeof TestManager.prototype.options = {}) {
    return new Promise<TestManager>((resolve) => {
      const testManager = new TestManager(channel, {
        ...options,
        onReady: () => {
          resolve(testManager);
          options.onReady?.();
        },
      });
    });
  }
}

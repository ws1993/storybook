/* eslint-disable no-underscore-dangle */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

import { page } from '@vitest/browser/context';

import {
  DEFAULT_VIEWPORT_DIMENSIONS,
  type ViewportsGlobal,
  type ViewportsParam,
  setViewport,
} from './viewports';

vi.mock('@vitest/browser/context', () => ({
  page: {
    viewport: vi.fn(),
  },
}));

describe('setViewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__vitest_browser__ = true;
  });

  afterEach(() => {
    globalThis.__vitest_browser__ = false;
  });

  it('should no op outside when not in Vitest browser mode', async () => {
    globalThis.__vitest_browser__ = false;

    await setViewport();
    expect(page.viewport).not.toHaveBeenCalled();
  });

  describe('globals API', () => {
    it('should fall back to DEFAULT_VIEWPORT_DIMENSIONS if selected viewport does not exist', async () => {
      const viewportsGlobal: ViewportsGlobal = {
        value: 'nonExistentViewport',
      };

      await setViewport({}, { viewport: viewportsGlobal });
      expect(page.viewport).toHaveBeenCalledWith(
        DEFAULT_VIEWPORT_DIMENSIONS.width,
        DEFAULT_VIEWPORT_DIMENSIONS.height
      );
    });

    it('should fall back to DEFAULT_VIEWPORT_DIMENSIONS if viewport is disabled, even if a viewport is set', async () => {
      const viewportsParam: ViewportsParam = {
        options: INITIAL_VIEWPORTS,
        disable: true,
      };
      const viewportsGlobal: ViewportsGlobal = {
        value: 'ipad',
      };

      await setViewport({ viewport: viewportsParam }, { viewport: viewportsGlobal });
      expect(page.viewport).toHaveBeenCalledWith(
        DEFAULT_VIEWPORT_DIMENSIONS.width,
        DEFAULT_VIEWPORT_DIMENSIONS.height
      );
    });

    it('should set the dimensions of viewport from INITIAL_VIEWPORTS', async () => {
      const viewportsParam: ViewportsParam = {
        options: INITIAL_VIEWPORTS,
      };
      const viewportsGlobal: ViewportsGlobal = {
        // supported by default in addon viewports
        value: 'ipad',
      };

      await setViewport({ viewport: viewportsParam }, { viewport: viewportsGlobal });
      expect(page.viewport).toHaveBeenCalledWith(768, 1024);
    });

    it('should set custom defined viewport dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        options: {
          customViewport: {
            name: 'Custom Viewport',
            type: 'mobile',
            styles: {
              width: '800px',
              height: '600px',
            },
          },
        },
      };
      const viewportsGlobal: ViewportsGlobal = {
        value: 'customViewport',
      };

      await setViewport({ viewport: viewportsParam }, { viewport: viewportsGlobal });
      expect(page.viewport).toHaveBeenCalledWith(800, 600);
    });

    it('should correctly handle percentage-based dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        options: {
          percentageViewport: {
            name: 'Percentage Viewport',
            type: 'desktop',
            styles: {
              width: '50%',
              height: '50%',
            },
          },
        },
      };
      const viewportsGlobal: ViewportsGlobal = {
        value: 'percentageViewport',
      };

      await setViewport({ viewport: viewportsParam }, { viewport: viewportsGlobal });
      expect(page.viewport).toHaveBeenCalledWith(600, 450); // 50% of 1920 and 1080
    });

    it('should correctly handle vw and vh based dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        options: {
          viewportUnits: {
            name: 'VW/VH Viewport',
            type: 'desktop',
            styles: {
              width: '50vw',
              height: '50vh',
            },
          },
        },
      };
      const viewportsGlobal: ViewportsGlobal = {
        value: 'viewportUnits',
      };

      await setViewport({ viewport: viewportsParam }, { viewport: viewportsGlobal });
      expect(page.viewport).toHaveBeenCalledWith(600, 450); // 50% of 1920 and 1080
    });

    it('should correctly handle em based dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        options: {
          viewportUnits: {
            name: 'em/rem Viewport',
            type: 'mobile',
            styles: {
              width: '20em',
              height: '40rem',
            },
          },
        },
      };
      const viewportsGlobal: ViewportsGlobal = {
        value: 'viewportUnits',
      };

      await setViewport({ viewport: viewportsParam }, { viewport: viewportsGlobal });
      expect(page.viewport).toHaveBeenCalledWith(320, 640); // dimensions * 16
    });

    it('should throw an error for unsupported dimension values', async () => {
      const viewportsParam: ViewportsParam = {
        options: {
          invalidViewport: {
            name: 'Invalid Viewport',
            type: 'desktop',
            styles: {
              width: 'calc(100vw - 20px)',
              height: '10pc',
            },
          },
        },
      };
      const viewportsGlobal: ViewportsGlobal = {
        value: 'invalidViewport',
      };

      await expect(setViewport({ viewport: viewportsParam }, { viewport: viewportsGlobal })).rejects
        .toThrowErrorMatchingInlineSnapshot(`
      [SB_ADDON_VITEST_0001 (UnsupportedViewportDimensionError): Encountered an unsupported value "calc(100vw - 20px)" when setting the viewport width dimension.

      The Storybook plugin only supports values in the following units:
      - px, vh, vw, em, rem and %.

      You can either change the viewport for this story to use one of the supported units or skip the test by adding '!test' to the story's tags per https://storybook.js.org/docs/writing-stories/tags]
    `);
      expect(page.viewport).not.toHaveBeenCalled();
    });
  });

  describe('parameters API (legacy)', () => {
    it('should no op outside when not in Vitest browser mode', async () => {
      globalThis.__vitest_browser__ = false;

      await setViewport();
      expect(page.viewport).not.toHaveBeenCalled();
    });

    it('should fall back to DEFAULT_VIEWPORT_DIMENSIONS if defaultViewport does not exist', async () => {
      const viewportsParam: any = {
        defaultViewport: 'nonExistentViewport',
      };

      await setViewport({ viewport: viewportsParam });
      expect(page.viewport).toHaveBeenCalledWith(
        DEFAULT_VIEWPORT_DIMENSIONS.width,
        DEFAULT_VIEWPORT_DIMENSIONS.height
      );
    });

    it('should set the dimensions of viewport from INITIAL_VIEWPORTS', async () => {
      const viewportsParam: any = {
        viewports: INITIAL_VIEWPORTS,
        // supported by default in addon viewports
        defaultViewport: 'ipad',
      };

      await setViewport({ viewport: viewportsParam });
      expect(page.viewport).toHaveBeenCalledWith(768, 1024);
    });

    it('should set custom defined viewport dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        defaultViewport: 'customViewport',
        viewports: {
          customViewport: {
            name: 'Custom Viewport',
            type: 'mobile',
            styles: {
              width: '800px',
              height: '600px',
            },
          },
        },
      };

      await setViewport({ viewport: viewportsParam });
      expect(page.viewport).toHaveBeenCalledWith(800, 600);
    });

    it('should correctly handle percentage-based dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        defaultViewport: 'percentageViewport',
        viewports: {
          percentageViewport: {
            name: 'Percentage Viewport',
            type: 'desktop',
            styles: {
              width: '50%',
              height: '50%',
            },
          },
        },
      };

      await setViewport({ viewport: viewportsParam });
      expect(page.viewport).toHaveBeenCalledWith(600, 450); // 50% of 1920 and 1080
    });

    it('should correctly handle vw and vh based dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        defaultViewport: 'viewportUnits',
        viewports: {
          viewportUnits: {
            name: 'VW/VH Viewport',
            type: 'desktop',
            styles: {
              width: '50vw',
              height: '50vh',
            },
          },
        },
      };

      await setViewport({ viewport: viewportsParam });
      expect(page.viewport).toHaveBeenCalledWith(600, 450); // 50% of 1920 and 1080
    });

    it('should correctly handle em based dimensions', async () => {
      const viewportsParam: ViewportsParam = {
        defaultViewport: 'viewportUnits',
        viewports: {
          viewportUnits: {
            name: 'em/rem Viewport',
            type: 'mobile',
            styles: {
              width: '20em',
              height: '40rem',
            },
          },
        },
      };

      await setViewport({ viewport: viewportsParam });
      expect(page.viewport).toHaveBeenCalledWith(320, 640); // dimensions * 16
    });

    it('should throw an error for unsupported dimension values', async () => {
      const viewportsParam: ViewportsParam = {
        defaultViewport: 'invalidViewport',
        viewports: {
          invalidViewport: {
            name: 'Invalid Viewport',
            type: 'desktop',
            styles: {
              width: 'calc(100vw - 20px)',
              height: '10pc',
            },
          },
        },
      };

      await expect(setViewport({ viewport: viewportsParam })).rejects
        .toThrowErrorMatchingInlineSnapshot(`
      [SB_ADDON_VITEST_0001 (UnsupportedViewportDimensionError): Encountered an unsupported value "calc(100vw - 20px)" when setting the viewport width dimension.

      The Storybook plugin only supports values in the following units:
      - px, vh, vw, em, rem and %.

      You can either change the viewport for this story to use one of the supported units or skip the test by adding '!test' to the story's tags per https://storybook.js.org/docs/writing-stories/tags]
    `);
      expect(page.viewport).not.toHaveBeenCalled();
    });
  });
});

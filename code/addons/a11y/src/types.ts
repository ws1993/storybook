import type { AxeResults } from 'axe-core';

export type A11YReport = AxeResults | { error: Error };

export interface A11yParameters {
  /**
   * Accessibility configuration
   *
   * @see https://storybook.js.org/docs/writing-tests/accessibility-testing
   */
  a11y?: {
    /** Manual configuration for specific elements */
    element?: string | string[];

    /** Configuration for the accessibility rules */
    config?: {
      /** Rules to run against the matching elements */
      rules?: Array<{
        id: string;
        enabled?: boolean;
        selector?: string;
      }>;
      /** Elements to exclude from accessibility checks */
      exclude?: string[];
    };

    /**
     * Options for the accessibility checks To learn more about the available options,
     *
     * @see https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter
     */
    options?: Record<string, any>;

    /** Turn off this addon's behavior */
    disable?: boolean;
  };
}

export interface A11yGlobals {
  a11y: {
    /**
     * Prevent the addon to execute automatic accessibility checks upon visiting a story. You can
     * still trigger the checks from the addon panel.
     */
    manual?: boolean;
  };
}

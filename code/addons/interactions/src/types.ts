export interface InteractionsParameters {
  /**
   * Interactions configuration
   *
   * @see https://storybook.js.org/docs/essentials/interactions
   */
  interactions: {
    /** Turn off this addon's behavior */
    disable?: boolean;

    /** Ignore unhandled errors during test execution */
    dangerouslyIgnoreUnhandledErrors?: boolean;

    /** Whether to throw exceptions coming from the play function */
    throwPlayFunctionExceptions?: boolean;
  };
}

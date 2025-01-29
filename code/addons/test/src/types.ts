export interface TestParameters {
  /**
   * Interactions configuration
   *
   * @see https://storybook.js.org/docs/writing-tests/test-addon
   */
  test: {
    /** Turn off this addon's behavior */
    disable?: boolean;

    /** Ignore unhandled errors during test execution */
    dangerouslyIgnoreUnhandledErrors?: boolean;

    /** Whether to throw exceptions coming from the play function */
    throwPlayFunctionExceptions?: boolean;
  };
}

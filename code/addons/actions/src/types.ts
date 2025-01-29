export interface ActionsParameters {
  /**
   * Actions configuration
   *
   * @see https://storybook.js.org/docs/essentials/actions#parameters
   */
  actions: {
    /**
     * Create actions for each arg that matches the regex.
     *
     * This is quite useful when your component has dozens (or hundreds) of methods and you do not
     * want to manually apply the fn utility for each of those methods. However, this is not the
     * recommended way of writing actions. That's because automatically inferred args are not
     * available as spies in your play function. If you use argTypesRegex and your stories have play
     * functions, you will need to also define args with the fn utility to test them in your play
     * function.
     *
     * @example ArgTypesRegex: '^on.*'
     */
    argTypesRegex?: string;

    /** Turn off this addon's behavior */
    disable?: boolean;

    /**
     * Binds a standard HTML event handler to the outermost HTML element rendered by your component
     * and triggers an action when the event is called for a given selector. The format is
     * `<eventname> <selector>`. The selector is optional; it defaults to all elements.
     *
     * @example Handles: ['mouseover', 'click .btn']
     */
    handles?: string[];
  };
}

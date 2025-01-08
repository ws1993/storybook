/**
 * This module is mocked, because it uses something node-internal that's not in our node-polyfills
 * In storybook, we don't need to know if we are in a CI environment, because we will never be.
 */

export default false;

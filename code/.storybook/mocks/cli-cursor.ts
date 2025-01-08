/**
 * This module takes the stdin, but ink doesn't pass it to the methods; that causes the methods to
 * assume node:process-stdin, but that breaks, causing the code to fail. I mocked the 2 methods, so
 * they do nothing. There is no cursor in storybook.
 */

export default {
  show: () => {},
  hide: () => {},
};

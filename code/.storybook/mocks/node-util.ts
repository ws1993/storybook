/**
 * This module is mocked, because ink, and a few ink related modules use the named exports, which
 * the node-polyfills to not supply
 */

export * from 'util';

export const isDeepStrictEqual = (a: any, b: any) => {
  return a === b;
};

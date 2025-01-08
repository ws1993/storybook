/**
 * This module is mocked, because ink, and a few ink related modules use the named exports, which
 * the node-polyfills to not supply
 */
import process from 'vite-plugin-node-polyfills/shims/process';

export * from 'vite-plugin-node-polyfills/shims/process';

export default process;

export const cwd = () => '/';
export const env = {};

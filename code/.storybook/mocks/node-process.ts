export * from 'vite-plugin-node-polyfills/shims/process';

import process from 'vite-plugin-node-polyfills/shims/process';
export default process;

export const cwd = () => '/';
export const env = {};

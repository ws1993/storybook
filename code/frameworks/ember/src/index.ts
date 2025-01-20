/// <reference types="webpack-env" />

export * from './types';
export * from './defineMainConfig';

// optimization: stop HMR propagation in webpack

// optimization: stop HMR propagation in webpack
if (typeof module !== 'undefined') {
  module?.hot?.decline();
}

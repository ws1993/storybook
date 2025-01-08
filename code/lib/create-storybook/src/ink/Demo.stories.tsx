/* eslint-disable no-underscore-dangle */
import React from 'react';

import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import EventEmitter from 'events';
import { render } from 'ink';

import { Demo } from './Demo';

interface Stream extends EventEmitter {
  output: string;
  columns: number;
  rows: number;
  write(str: string): void;
  setEncoding(): void;
  setRawMode(): void;
  resume(): void;
  pause(): void;
  get(): string;
  isTTY: boolean;
}

export default {
  component: Demo,
  args: {
    name: 'world',
    width: 200,
    height: 40,
  },
  decorators: [
    (Story, { id }) => {
      globalThis.__XTERM_INSTANCES__ = globalThis.__XTERM_INSTANCES__ || {};

      if (globalThis.__XTERM_INSTANCES__[id]) {
        globalThis.__XTERM_INSTANCES__[id].dispose();
      }

      const term = new Terminal({ convertEol: true, disableStdin: false, cols: 120, rows: 26 });

      globalThis.__XTERM_INSTANCES__[id] = term;

      const createStdout = (columns?: number): Stream => {
        const stdout = new EventEmitter() as Stream;
        stdout.columns = columns ?? 120;
        stdout.rows = 26;
        stdout.isTTY = true;
        stdout.write = (str: string) => {
          term.write(str.trim());
        };
        stdout.setEncoding = () => {};
        stdout.setRawMode = () => {};
        stdout.ref = () => {};
        stdout.unref = () => {};
        stdout.resume = () => {};
        stdout.pause = () => {};
        return stdout;
      };

      const stdout = createStdout() as any;
      const stdin = createStdout() as any;

      term.onData((data) => {
        stdin.emit('data', data);
      });

      const element = document.getElementById(`terminal--${id}`);

      if (element) {
        element.innerHTML = '';
        term.open(document.getElementById(`terminal--${id}`) as HTMLElement);
        term.focus();
        render(React.createElement(Story, {}), {
          stdout: stdout,
          stderr: stdout,
          stdin,
          debug: false,
          patchConsole: false,
          isTTY: false,
        });
      } else {
        setTimeout(() => {
          term.open(document.getElementById(`terminal--${id}`) as HTMLElement);
          term.focus();
          render(React.createElement(Story, {}), {
            stdout: stdout,
            stderr: stdout,
            stdin,
            debug: false,
            patchConsole: false,
            isTTY: false,
          });
        }, 100);
      }

      return <div id={`terminal--${id}`}></div>;
    },
  ],
};

export const First = {};

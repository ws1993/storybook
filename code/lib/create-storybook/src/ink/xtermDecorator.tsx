/* eslint-disable no-underscore-dangle */
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';

import type { Decorator } from '@storybook/react';

import '@xterm/xterm/css/xterm.css';
import EventEmitter from 'events';
import type { ReadStream, WriteStream } from 'tty';

import { AppContext } from './utils/context';

interface Stream extends EventEmitter {
  output: string;
  columns: number;
  rows: number;
  write(str: string): void;
  setEncoding(): void;
  setRawMode(): void;
  ref(): void;
  unref(): void;
  resume(): void;
  pause(): void;
  get(): string;
  isTTY: boolean;
}

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __XTERM_INSTANCES__: any;
}

export const xtermDecorator: Decorator = (Story, { id, parameters }) => {
  globalThis.__XTERM_INSTANCES__ = globalThis.__XTERM_INSTANCES__ || {};

  if (globalThis.__XTERM_INSTANCES__[id]) {
    globalThis.__XTERM_INSTANCES__[id].dispose();
  }

  if (navigator.userAgent.includes('Firefox')) {
    return <div>Not supported in Firefox</div>;
  }

  Promise.all([import('ink'), import('@xterm/xterm'), import('@xterm/addon-fit')]).then(
    ([{ Box, render, useStdin }, { Terminal }, { FitAddon }]) => {
      const terminal = new Terminal({ convertEol: true, disableStdin: false });
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      globalThis.__XTERM_INSTANCES__[id] = terminal;

      const ForwardInputEvents = ({ children }: { children: ReactNode }) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { internal_eventEmitter } = useStdin();
        useEffect(() => {
          terminal.onData((data) => internal_eventEmitter.emit('input', data));
        }, [internal_eventEmitter]);
        return children;
      };

      const createIOStream = () => {
        const stream = new EventEmitter() as Stream;
        stream.columns = 120;
        stream.rows = 60;
        stream.isTTY = true;
        stream.write = (str: string) => {
          terminal.write(str.trim());
        };
        stream.setEncoding = () => {};
        stream.setRawMode = () => {};
        stream.ref = () => {};
        stream.unref = () => {};
        stream.resume = () => {};
        stream.pause = () => {};
        return stream;
      };

      const stdout = createIOStream() as any as WriteStream;
      const stdin = createIOStream() as any as ReadStream;

      const resizeToFit = () => {
        fitAddon.fit();

        const { cols = stdout.columns, rows = stdout.rows } = fitAddon.proposeDimensions() || {};
        if (cols === stdout.columns && rows === stdout.rows) {
          return false;
        }

        stdout.columns = cols;
        stdout.rows = rows;
        return true;
      };

      const renderToElement = () => {
        const element = document.getElementById(`terminal--${id}`) as HTMLElement;
        terminal.open(element);

        const ink = render(
          <ForwardInputEvents>
            <Box width={stdout.columns} height={stdout.rows}>
              <AppContext.Provider
                value={{
                  fs: undefined,
                  process: undefined,
                  child_process: undefined,
                  require: undefined,
                  glob: undefined,
                  steps: {
                    checkGitStatus: async () => parameters.git,
                    checkCompatibility: async () => parameters.check,
                    checkFramework: undefined,
                    VERSION: undefined,
                  },
                }}
              >
                <Story />
              </AppContext.Provider>
            </Box>
          </ForwardInputEvents>,
          {
            stdout: stdout,
            stderr: stdout,
            stdin,
            debug: false,
            patchConsole: false,
            isTTY: true,
          }
        );

        const resizeObserver = new ResizeObserver(() => {
          if (resizeToFit()) {
            ink.rerender(
              <ForwardInputEvents>
                <Box width={stdout.columns} height={stdout.rows}>
                  <AppContext.Provider
                    value={{
                      fs: undefined,
                      process: undefined,
                      child_process: undefined,
                      require: undefined,
                      glob: undefined,
                      steps: {
                        checkGitStatus: async () => parameters.git,
                        checkCompatibility: async () => parameters.check,
                        checkFramework: undefined,
                        VERSION: undefined,
                      },
                    }}
                  >
                    <Story />
                  </AppContext.Provider>
                </Box>
              </ForwardInputEvents>
            );
          }
        });

        resizeObserver.observe(element);
      };

      const element = document.getElementById(`terminal--${id}`);
      if (element) {
        element.innerHTML = '';
        renderToElement();
      } else {
        setTimeout(renderToElement, 100);
      }
    }
  );

  return <div id={`terminal--${id}`} style={{ height: '100vh', width: '100vw' }}></div>;
};

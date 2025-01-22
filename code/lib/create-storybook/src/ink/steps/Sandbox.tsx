import { isAbsolute, join } from 'node:path';

import React, { type Dispatch, useContext, useEffect, useMemo, useState } from 'react';

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';

import { type Action, type State } from '.';
import { baseTemplates } from '../../../../cli-storybook/src/sandbox-templates';
import { MultiSelect } from '../components/Select/MultiSelect';
import { AppContext } from '../utils/context';

function SandboxDownload({
  framework,
  location,
  dispatch,
}: {
  framework: string;
  location: string;
  dispatch: Dispatch<Action>;
}) {
  const options = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(baseTemplates)
          .filter(([key, item]) => item.expected.framework.includes(`/${framework}`))
          .map(([k, v]) => [k, v.name])
      ),
    [framework]
  );
  const list = Object.entries(options);
  const first = list[0];
  const [selected, setSelected] = useState<string | undefined>(
    list.length === 1 ? first[0] : undefined
  );

  const context = useContext(AppContext);

  useEffect(() => {
    if (selected && !baseTemplates[selected as keyof typeof baseTemplates]) {
      setSelected(undefined);
      return;
    }
    if (context.downloadSandbox && selected) {
      context.downloadSandbox(location, selected).then(() => {
        dispatch({ type: 'NEXT' });
      });
    }
  }, [selected]);

  return (
    <Box flexDirection="column" gap={1}>
      {!selected && (
        <>
          <Text>Storybook needs to scaffold project to initialize on top off.</Text>
          <Box gap={1}>
            <Spinner />
            <Text>
              Creating a new project in the directory: <Text color="cyan">{location}</Text>
            </Text>
          </Box>

          <Text>Select a template to download:</Text>
          <MultiSelect
            options={options}
            selection={[]}
            setSelection={(value) => {
              if (value[0]) {
                setSelected(value[0].toString());
              }
            }}
            isDisabled={false}
          />
        </>
      )}
      {selected && (
        <Box gap={1}>
          <Spinner />
          <Text>Downloading template...</Text>
        </Box>
      )}
    </Box>
  );
}

export function SANDBOX({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [exists, setExists] = useState<ExistsResult>('loading');

  const context = useContext(AppContext);
  const directory = isAbsolute(state.directory)
    ? state.directory
    : join(process.cwd(), state.directory);

  const framework = state.framework;
  useEffect(() => {
    if (context.checkExists) {
      context.checkExists(directory).then((result) => {
        if (result === 'exists') {
          dispatch({ type: 'NEXT' });
        } else {
          setExists(result);
        }
      });
    }
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      {exists === 'loading' && (
        <Box gap={1}>
          <Spinner />
          <Text>We're checking if the project needs a scaffold..</Text>
        </Box>
      )}
      {exists === 'empty' && (
        <>
          <SandboxDownload framework={framework} dispatch={dispatch} location={directory} />
        </>
      )}
    </Box>
  );
}

type ExistsResult = 'loading' | 'empty' | 'exists';
/** Check if the user has pending changes */
export async function checkExists(location: string): Promise<ExistsResult> {
  // slow delay for demo effect
  const { stat, readdir, mkdir } = await import('fs/promises');

  try {
    const out = await stat(location);
    const isDirectory = out.isDirectory();
    if (isDirectory) {
      const files = await readdir(location);
      return files.length === 0 ? 'empty' : 'exists';
    }
    return 'exists';
  } catch (err) {
    await mkdir(location, { recursive: true });
    return 'empty';
  }
}

export async function downloadSandbox(location: string, templateId: string) {
  const { downloadTemplate } = await import('giget');

  const gitPath = `github:storybookjs/sandboxes/${templateId}/before-storybook#main`;

  await downloadTemplate(gitPath, {
    force: true,
    dir: location,
  });
}

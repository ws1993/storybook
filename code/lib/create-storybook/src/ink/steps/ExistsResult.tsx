export type ExistsResult = 'loading' | 'empty' | 'exists';
/** Check if the user has pending changes */
export async function checkExists(location: string): Promise<ExistsResult> {
  // slow delay for demo effect
  const { stat, readdir, mkdir } = await import('node:fs/promises');

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

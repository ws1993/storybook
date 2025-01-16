import { promises as fs } from 'fs';
// eslint-disable-next-line depend/ban-dependencies
import { glob } from 'glob';
import picocolors from 'picocolors';

const logger = console;

export interface FileInfo {
  path: string;
  source: string;
}

/**
 * Runs a codemod transformation on files matching the specified glob pattern.
 *
 * The function processes each file matching the glob pattern, applies the transform function, and
 * writes the transformed source back to the file if it has changed.
 *
 * @example
 *
 * ```
 * await runCodemod('*.stories.tsx', async (fileInfo) => {
 *   // Transform the file source return
 *   return fileInfo.source.replace(/foo/g, 'bar');
 * });
 * ```
 */
export async function runCodemod(
  globPattern: string = '**/*.stories.*',
  transform: (source: FileInfo) => Promise<string>,
  { dryRun = false }: { dryRun?: boolean } = {}
) {
  let modifiedCount = 0;
  let unmodifiedCount = 0;
  let errorCount = 0;

  try {
    const files = await glob(globPattern, {
      nodir: true,
      follow: true,
      ignore: ['node_modules/**', 'dist/**', 'storybook-static/**', 'build/**'],
    });

    await Promise.all(
      files.map(async (file) => {
        try {
          const source = await fs.readFile(file, 'utf-8');
          const fileInfo: FileInfo = { path: file, source };
          const transformedSource = await transform(fileInfo);

          if (transformedSource !== source) {
            if (!dryRun) {
              await fs.writeFile(file, transformedSource, 'utf-8');
            }
            modifiedCount++;
          } else {
            unmodifiedCount++;
          }
        } catch (fileError) {
          logger.error(`Error processing file ${file}:`, fileError);
          errorCount++;
        }
      })
    );
  } catch (error) {
    logger.error('Error applying transform:', error);
    errorCount++;
  }

  logger.log(
    `Summary: ${picocolors.green(`${modifiedCount} transformed`)}, ${picocolors.yellow(`${unmodifiedCount} unmodified`)}, ${picocolors.red(`${errorCount} errors`)}`
  );

  if (dryRun) {
    logger.log(
      picocolors.bold(
        `This was a dry run. Run without --dry-run to apply the transformation to ${modifiedCount} files.`
      )
    );
  }
}

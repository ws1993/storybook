/* eslint-disable no-underscore-dangle */
import { addToGlobalContext } from 'storybook/internal/telemetry';

import { program } from 'commander';

import { version } from '../../package.json';
import type { CommandOptions } from '../generators/types';
import { initiate } from '../initiate';
import { modernInputs } from './modernInputs';

const IS_NON_CI = process.env.CI !== 'true';
const IS_NON_STORYBOOK_SANDBOX = process.env.IN_STORYBOOK_SANDBOX !== 'true';

addToGlobalContext('cliVersion', version);

/**
 * Create a commander application with flags for both legacy and modern. We then check the options
 * given by commander with zod. If zod validates the options, we run the modern version of the app.
 * If zod fails to validate the options, we check why, and if it's because of a legacy flag, we run
 * the legacy version of the app.
 */

const createStorybookProgram = program.name('Initialize Storybook into your project.');

const modernProgram = Object.entries(modernInputs.shape).reduce((acc, [key, schema]) => {
  // @ts-expect-error (Object.entries loses type information)
  const { innerType, defaultValue, description } = schema._def;
  let t = innerType;

  // @ts-expect-error (Object.entries loses type information)
  while (t._def.innerType) {
    // @ts-expect-error (Object.entries loses type information)
    t = t._def.innerType;
  }

  const { typeName } = t._def;
  const value = defaultValue ? defaultValue() : undefined;

  // to dash-case
  const flag = key
    .split(/(?=[A-Z])/)
    .join('-')
    .toLowerCase();

  if (typeName.match('Array')) {
    acc.option(`--${flag} <options...>`, description, value);
  } else if (typeName.match('String')) {
    acc.option(`--${flag} <option>`, description, value);
  } else if (typeName.match('Enum')) {
    acc.option(`--${flag} <option>`, description, value);
  } else if (typeName.match('Boolean')) {
    acc.option(`--${flag}`, description, value);
    if (!key.includes('ignore')) {
      acc.option(`--no-${flag}`, `inverted --${flag}`);
    }
  }

  return acc;
}, createStorybookProgram);

const legacyProgram = modernProgram
  .option(
    '--disable-telemetry',
    'Disable sending telemetry data',
    // default value is false, but if the user sets STORYBOOK_DISABLE_TELEMETRY, it can be true
    process.env.STORYBOOK_DISABLE_TELEMETRY && process.env.STORYBOOK_DISABLE_TELEMETRY !== 'false'
  )
  .option('--debug', 'Get more logs in debug mode')
  .option('--enable-crash-reports', 'Enable sending crash reports to telemetry data')
  .option('-f --force', 'Force add Storybook')
  .option('-s --skip-install', 'Skip installing deps')
  .option(
    '--package-manager <npm|pnpm|yarn1|yarn2|bun>',
    'Force package manager for installing deps'
  )
  .option('--use-pnp', 'Enable pnp mode for Yarn 2+')
  .option('-p --parser <babel | babylon | flow | ts | tsx>', 'jscodeshift parser')
  .option('-t --type <type>', 'Add Storybook for a specific project type')
  .option('-y --yes', 'Answer yes to all prompts')
  .option('-b --builder <webpack5 | vite>', 'Builder library')
  .option('-l --linkable', 'Prepare installation for link (contributor helper)')
  // due to how Commander handles default values and negated options, we have to elevate the default into Commander, and we have to specify `--dev`
  // alongside `--no-dev` even if we are unlikely to directly use `--dev`. https://github.com/tj/commander.js/issues/2068#issuecomment-1804524585
  .option(
    '--dev',
    'Launch the development server after completing initialization. Enabled by default'
  )
  .option(
    '--no-dev',
    'Complete the initialization of Storybook without launching the Storybook development server'
  );

legacyProgram
  .action(async (options) => {
    // const d = modernInputs.safeParse(options);

    // if (d.success) {
    //   // modern CLI app
    //   const { run } = await import('../ink/app');
    //   await run(d.data);
    // } else if (d.error) {
    //   if (d.error.errors.some((e) => e.code === 'unrecognized_keys')) {
    //     // legacy CLI app
    options.debug = options.debug ?? false;
    options.dev = options.dev ?? (IS_NON_CI && IS_NON_STORYBOOK_SANDBOX);

    await initiate(options as CommandOptions).catch(() => process.exit(1));
    // } else {
    //   for (const e of d.error.errors) {
    //     console.error('invalid input for: --' + e.path.join('.'));
    //     console.log(e.message);
    //   }
    // }
    // }
  })
  .version(String(version))
  .parse(process.argv);

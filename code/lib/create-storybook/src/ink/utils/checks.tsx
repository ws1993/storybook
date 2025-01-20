import type { State } from '../steps';

export type ExistsResult = 'loading' | 'empty' | 'exists';
/** Check if the user has pending changes */
export async function checkExists(location: string): Promise<ExistsResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'exists';
}

export type VersionResult = 'loading' | 'latest' | 'outdated';
export async function checkVersion(): Promise<VersionResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'latest';
}

export type FrameworkResult = State['framework'] | 'undetected';
export async function checkFramework(): Promise<FrameworkResult> {
  // slow delay for demo effect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return 'ember';
}

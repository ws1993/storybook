import { AngularJSON, isNxProject } from 'storybook/internal/cli';

import picocolors from 'picocolors';
import semver from 'semver';
import { dedent } from 'ts-dedent';

import { getFrameworkPackageName } from '../helpers/mainConfigFile';
import type { Fix } from '../types';

interface AngularBuildersMultiprojectRunOptions {}

export const angularBuildersMultiproject: Fix<AngularBuildersMultiprojectRunOptions> = {
  id: 'angular-builders-multiproject',
  promptType: 'manual',

  versionRange: ['<7', '>=7'],

  async check({ packageManager, mainConfig }) {
    // Skip in case of NX
    const angularVersion = await packageManager.getPackageVersion('@angular/core');
    const frameworkPackageName = getFrameworkPackageName(mainConfig);

    if (
      (await isNxProject()) ||
      frameworkPackageName !== '@storybook/angular' ||
      !angularVersion ||
      semver.lt(angularVersion, '14.0.0')
    ) {
      return null;
    }

    const angularJSON = new AngularJSON();

    const { hasStorybookBuilder } = angularJSON;

    // skip if workspace has already one or more Storybook builder
    if (hasStorybookBuilder) {
      return null;
    }

    if (angularJSON.rootProject || Object.keys(angularJSON.projects).length === 1) {
      return null;
    }

    return {};
  },

  prompt() {
    return dedent`
    In Storybook 6.4 we have deprecated calling Storybook directly (npm run storybook) for Angular. In Storybook 7.0, we've removed it entirely. Instead you have to set up the Storybook builder in your ${picocolors.yellow(
      'angular.json'
    )} and execute ${picocolors.yellow('ng run <your-project>:storybook')} to start Storybook. 
    
    ❌ Your Angular workspace uses multiple projects defined in the ${picocolors.yellow(
      'angular.json'
    )} file and we were not able to detect a root project. Therefore we are not able to automigrate to use Angular Storybook builder. Instead, please visit ${picocolors.yellow(
      'https://github.com/storybookjs/storybook/tree/next/code/frameworks/angular'
    )} to do the migration manually.
    `;
  },
};

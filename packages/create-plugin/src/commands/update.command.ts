import minimist from 'minimist';
import chalk from 'chalk';
import { TEXT, UDPATE_CONFIG } from '../constants.js';
import { compileTemplateFiles, getTemplateData } from '../utils/utils.templates.js';
import { confirmPrompt, selectPrompt, printMessage, printSuccessMessage, printRedBox } from '../utils/utils.console.js';
import {
  updatePackageJson,
  hasNpmDependenciesToUpdate,
  getPackageJsonUpdatesAsText,
  updateNpmScripts,
  writePackageManagerInPackageJson,
} from '../utils/utils.npm.js';
import { getPackageManagerWithFallback } from '../utils/utils.packageManager.js';
import { isGitDirectory, isGitDirectoryClean } from '../utils/utils.git.js';

export const update = async (argv: minimist.ParsedArgs) => {
  try {
    if (!(await isGitDirectory()) && !argv.force) {
      printRedBox({
        title: 'You are not inside a git directory',
        content: `In order to proceed please run "git init" in the root of your project and commit your changes.\n
(This check is necessary to make sure that the updates are easy to revert and don't mess with any changes you currently have.
In case you want to proceed as is please use the ${chalk.bold('--force')} flag.)`,
      });

      process.exit(1);
    }

    if (!(await isGitDirectoryClean()) && !argv.force) {
      printRedBox({
        title: 'Please clean your repository working tree before updating.',
        subtitle: '(Commit your changes or stash them.)',
        content: `(This check is necessary to make sure that the updates are easy to revert and don't mess with any changes you currently have.
In case you want to proceed as is please use the ${chalk.bold('--force')} flag.)`,
      });

      process.exit(1);
    }

    // 0. Warning
    // ----------
    printMessage(TEXT.updateCommandWarning);

    // 1. Add / update configuration files
    // -----------------------------------
    if (await confirmPrompt(TEXT.updateConfigPrompt)) {
      compileTemplateFiles(UDPATE_CONFIG.filesToOverride, getTemplateData());
      printSuccessMessage(TEXT.overrideFilesSuccess);
    } else {
      printMessage(TEXT.overrideFilesAborted);
      process.exit(0);
    }

    // 2. Add / update dev dependencies inside the `package.json`
    // (skipped automatically if there is nothing to update)
    // ------------------------------------------------
    if (hasNpmDependenciesToUpdate({ devOnly: true })) {
      const updatableText = getPackageJsonUpdatesAsText({ ignoreGrafanaDependencies: true, devOnly: true });

      if (updatableText.length > 0) {
        const PROMPT_CHOICES = {
          ALL: 'Yes, all of them',
          ONLY_OUTDATED: 'Yes, but only the outdated ones',
          NONE: 'No',
        };

        const shouldUpdateDeps = await selectPrompt(TEXT.updateNpmDependenciesPrompt + updatableText, [
          PROMPT_CHOICES.ALL,
          PROMPT_CHOICES.ONLY_OUTDATED,
          PROMPT_CHOICES.NONE,
        ]);

        if (shouldUpdateDeps && shouldUpdateDeps !== PROMPT_CHOICES.NONE) {
          updatePackageJson({
            onlyOutdated: shouldUpdateDeps === PROMPT_CHOICES.ONLY_OUTDATED,
            ignoreGrafanaDependencies: true,
            devOnly: true,
          });
          printSuccessMessage(TEXT.updateNpmDependenciesSuccess);
        } else {
          printMessage(TEXT.updateNpmDependenciesAborted);
        }
      }
    }

    // 3. Add / update NPM scripts
    // (skipped automatically if there is nothing to update)
    // ------------------------------------------------
    if (await confirmPrompt(TEXT.updateNpmScriptsPrompt)) {
      updateNpmScripts();
      printSuccessMessage(TEXT.updateNpmScriptsSuccess);
    } else {
      printMessage(TEXT.updateNpmScriptsAborted);
    }

    // Guarantee that the package manager property is set in the package.json file if it is missing
    const packageManager = getPackageManagerWithFallback();
    writePackageManagerInPackageJson(packageManager);

    // 4. Summary
    // -------------
    printSuccessMessage(TEXT.updateCommandSuccess);
  } catch (error) {
    console.error(error);
  }
};

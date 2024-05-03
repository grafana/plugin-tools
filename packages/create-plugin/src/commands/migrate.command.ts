import { TEXT, MIGRATION_CONFIG } from '../constants.js';
import { displayArrayAsList, printMessage, printSuccessMessage, confirmPrompt } from '../utils/utils.console.js';
import { compileTemplateFiles, getTemplateData } from '../utils/utils.templates.js';
import {
  getExportTemplateName,
  getOnlyExistingInCwd,
  getOnlyNotExistingInCwd,
  removeFilesInCwd,
} from '../utils/utils.files.js';
import {
  getPackageJsonUpdatesAsText,
  updatePackageJson,
  hasNpmDependenciesToUpdate,
  getRemovableNpmDependencies,
  removeNpmDependencies,
  updateNpmScripts,
  cleanUpPackageJson,
  writePackageManagerInPackageJson,
} from '../utils/utils.npm.js';
import { getPackageManagerWithFallback } from '../utils/utils.packageManager.js';

export const migrate = async () => {
  try {
    // 0. Warning
    // -----------
    printMessage(TEXT.migrationCommandWarning);

    // 1. Add / update configuration files
    // --------------------------
    if (await confirmPrompt(TEXT.overrideFilesPrompt + '\n' + displayArrayAsList(MIGRATION_CONFIG.filesToOverride))) {
      const templateData = getTemplateData();
      compileTemplateFiles(MIGRATION_CONFIG.filesToOverride.map(getExportTemplateName), templateData);
      printSuccessMessage(TEXT.overrideFilesSuccess);
    } else {
      printMessage(TEXT.overrideFilesAborted);
      process.exit(0);
    }

    // 2. Add necessary files if they don't exist (files we don't want to override)
    // (skipped automatically if there are none)
    // --------------------------------------------
    const filesToExist = getOnlyNotExistingInCwd(MIGRATION_CONFIG.filesToExist);
    if (filesToExist.length) {
      if (await confirmPrompt(TEXT.filesToExistPrompt + '\n' + displayArrayAsList(filesToExist))) {
        compileTemplateFiles(filesToExist, getTemplateData());
        printSuccessMessage(TEXT.filesToExistSuccess);
      } else {
        printMessage(TEXT.filesToExistAborted);
      }
    }

    // 3. Remove unnecessary files from the project
    // (skipped automatically if there are none)
    // --------------------------------------------
    const filesToRemove = getOnlyExistingInCwd(MIGRATION_CONFIG.filesToRemove);
    if (filesToRemove.length) {
      if (await confirmPrompt(TEXT.removeFilesPrompt + '\n' + displayArrayAsList(filesToRemove))) {
        removeFilesInCwd(filesToRemove);
        printSuccessMessage(TEXT.removeFilesSuccess);
      } else {
        printMessage(TEXT.removeFilesAborted);
      }
    }

    // 4. Add / update dependencies inside the `package.json`
    // (skipped automatically if there is nothing to update)
    // ------------------------------------------------
    if (hasNpmDependenciesToUpdate()) {
      if (
        await confirmPrompt(
          TEXT.updateNpmDependenciesPrompt + getPackageJsonUpdatesAsText({ ignoreGrafanaDependencies: true })
        )
      ) {
        updatePackageJson({ ignoreGrafanaDependencies: true });
        printSuccessMessage(TEXT.updateNpmDependenciesSuccess);
      } else {
        printMessage(TEXT.updateNpmDependenciesAborted);
      }
    }

    // 5. Remove unncessary NPM dependencies from `package.json`
    // (skipped automatically if there is nothing to be removed)
    // ------------------------------------------------
    const dependenciesToRemove = getRemovableNpmDependencies(MIGRATION_CONFIG.npmDependenciesToRemove);
    const devDependenciesToRemove = getRemovableNpmDependencies(MIGRATION_CONFIG.devNpmDependenciesToRemove);
    if (dependenciesToRemove.length) {
      if (await confirmPrompt(TEXT.removeNpmDependenciesPrompt + '\n' + displayArrayAsList(dependenciesToRemove))) {
        removeNpmDependencies(dependenciesToRemove);
        removeNpmDependencies(devDependenciesToRemove, { devOnly: true });
        printSuccessMessage(TEXT.removeNpmDependenciesSuccess);
      } else {
        printMessage(TEXT.removeNpmDependenciesAborted);
      }
    }

    // 6. Add / update NPM scripts
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

    // Tidy package.json file so any changed fields are sorted as a
    // package manager would expect.
    cleanUpPackageJson();

    // 7. Summary
    // -------------
    printSuccessMessage(TEXT.migrationCommandSuccess);
  } catch (error) {
    console.error(error);
  }
};

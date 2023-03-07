import { TEXT, UDPATE_CONFIG } from '../constants';
import { compileTemplateFiles, getTemplateData } from '../utils/utils.templates';
import { confirmPrompt, selectPrompt, printMessage, printSuccessMessage } from '../utils/utils.console';
import {
  updatePackageJson,
  hasNpmDependenciesToUpdate,
  getPackageJsonUpdatesAsText,
  updateNpmScripts,
} from '../utils/utils.npm';

export const update = async () => {
  try {
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

    // 2. Add / update dependencies inside the `package.json`
    // (skipped automatically if there is nothing to update)
    // ------------------------------------------------
    if (hasNpmDependenciesToUpdate()) {
      const shouldUpdateGrafanaDeps = await confirmPrompt(TEXT.updateGrafanaNpmDependenciesPrompt);

      const updatableText = getPackageJsonUpdatesAsText({ ignoreGrafanaDependencies: !shouldUpdateGrafanaDeps });

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
            ignoreGrafanaDependencies: !shouldUpdateGrafanaDeps,
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

    // 4. Summary
    // -------------
    printSuccessMessage(TEXT.updateCommandSuccess);
  } catch (error) {
    console.error(error);
  }
};

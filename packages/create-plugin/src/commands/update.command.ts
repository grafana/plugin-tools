import { TEXT, UDPATE_CONFIG } from '../constants';
import { compileTemplateFiles, getTemplateData } from '../utils/utils.templates';
import { confirmPrompt, selectPrompt, printMessage, printSuccessMessage } from '../utils/utils.console';
import {
  updatePackageJson,
  hasNpmDependenciesToUpdate,
  getPackageJsonUpdatesAsText,
  updateNpmScripts,
} from '../utils/utils.npm';

async function updateConfigurationFiles() {
  if (await confirmPrompt(TEXT.updateConfigPrompt)) {
    compileTemplateFiles(UDPATE_CONFIG.filesToOverride, getTemplateData());
    printSuccessMessage(TEXT.overrideFilesSuccess);
  } else {
    printMessage(TEXT.overrideFilesAborted);
    process.exit(0);
  }
}

async function updateNpmDependencies() {
  if (hasNpmDependenciesToUpdate()) {
    //  ask if we should update the grafana dependencies
    const shouldUpdateGrafanaPackages = await confirmPrompt(TEXT.updateNpmGrafanaPackagesPrompt);

    const updatadableDependenciesText = getPackageJsonUpdatesAsText({
      dontUpdateGrafanaDependencies: !shouldUpdateGrafanaPackages,
    });

    if (updatadableDependenciesText.length === 0) {
      // No dependencies to update
      return;
    }

    const PROMPT_CHOICES = {
      ALL: 'Yes, all of them',
      ONLY_OUTDATED: 'Yes, but only the outdated ones',
      NONE: 'No',
    };

    const shouldUpdateDeps = await selectPrompt(TEXT.updateNpmDependenciesPrompt + updatadableDependenciesText, [
      PROMPT_CHOICES.ALL,
      PROMPT_CHOICES.ONLY_OUTDATED,
      PROMPT_CHOICES.NONE,
    ]);

    if (shouldUpdateDeps && shouldUpdateDeps !== PROMPT_CHOICES.NONE) {
      updatePackageJson({
        dontUpdateGrafanaDependencies: !shouldUpdateGrafanaPackages,
        onlyOutdated: shouldUpdateDeps === PROMPT_CHOICES.ONLY_OUTDATED,
      });
      printSuccessMessage(TEXT.updateNpmDependenciesSuccess);
    } else {
      printMessage(TEXT.updateNpmDependenciesAborted);
    }
  } else {
    printMessage(TEXT.updateNpmDependenciesAborted);
  }
}

async function updatePackageJsonScripts() {
  if (await confirmPrompt(TEXT.updateNpmScriptsPrompt)) {
    updateNpmScripts();
    printSuccessMessage(TEXT.updateNpmScriptsSuccess);
  } else {
    printMessage(TEXT.updateNpmScriptsAborted);
  }
}

export const update = async () => {
  try {
    printMessage(TEXT.updateCommandWarning);

    // 1. Add / update configuration files
    await updateConfigurationFiles();

    // 2. Add / update dependencies inside the `package.json`
    // (skipped automatically if there is nothing to update)
    await updateNpmDependencies();

    // 3. Add / update NPM scripts
    // (skipped automatically if there is nothing to update)
    await updatePackageJsonScripts();

    // 4. Summary
    // -------------
    printSuccessMessage(TEXT.updateCommandSuccess);
  } catch (error) {
    console.error(error);
  }
};

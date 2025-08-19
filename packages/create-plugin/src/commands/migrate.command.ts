import { MIGRATION_CONFIG } from '../constants.js';
import { displayArrayAsList, confirmPrompt, output } from '../utils/utils.console.js';
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
import chalk from 'chalk';

export const migrate = async () => {
  try {
    // 0. Warning
    // -----------
    output.warning({
      title: 'Please make sure that you have backed up your changes before continuing.',
    });

    // 1. Add / update configuration files
    // --------------------------
    if (
      await confirmPrompt(
        'The following files will be overriden, would you like to continue?' +
          '\n' +
          displayArrayAsList(MIGRATION_CONFIG.filesToOverride)
      )
    ) {
      const templateData = getTemplateData();
      compileTemplateFiles(MIGRATION_CONFIG.filesToOverride.map(getExportTemplateName), templateData);
      output.log({
        title: 'Configuration files updated successfully.',
      });
    } else {
      output.log({
        title: 'Migration aborted.',
      });
      process.exit(0);
    }

    // 2. Add necessary files if they don't exist (files we don't want to override)
    // (skipped automatically if there are none)
    // --------------------------------------------
    const filesToExist = getOnlyNotExistingInCwd(MIGRATION_CONFIG.filesToExist);
    if (filesToExist.length) {
      if (
        await confirmPrompt(
          'The following files are necessary for the project to work, can we scaffold them for you?' +
            '\n' +
            displayArrayAsList(filesToExist)
        )
      ) {
        compileTemplateFiles(filesToExist, getTemplateData());
        output.log({
          title: 'Extra files created successfully.',
        });
      }
    }

    // 3. Remove unnecessary files from the project
    // (skipped automatically if there are none)
    // --------------------------------------------
    const filesToRemove = getOnlyExistingInCwd(MIGRATION_CONFIG.filesToRemove);
    if (filesToRemove.length) {
      if (
        await confirmPrompt(
          'The following files are possibly not needed for the project anymore, are you ok with us removing them?' +
            '\n' +
            displayArrayAsList(filesToRemove)
        )
      ) {
        removeFilesInCwd(filesToRemove);
        output.log({
          title: 'Unnecessary files have been removed successfully.',
        });
      }
    }

    // 4. Add / update dependencies inside the `package.json`
    // (skipped automatically if there is nothing to update)
    // ------------------------------------------------
    if (hasNpmDependenciesToUpdate()) {
      if (
        await confirmPrompt(
          'Would you like to update the following dependencies in the `package.json?`' +
            getPackageJsonUpdatesAsText({ ignoreGrafanaDependencies: true })
        )
      ) {
        updatePackageJson({ ignoreGrafanaDependencies: true });
        output.log({
          title: 'Successfully updated the NPM dependencies.',
        });
      }
    }

    // 5. Remove unncessary NPM dependencies from `package.json`
    // (skipped automatically if there is nothing to be removed)
    // ------------------------------------------------
    const dependenciesToRemove = getRemovableNpmDependencies(MIGRATION_CONFIG.npmDependenciesToRemove);
    const devDependenciesToRemove = getRemovableNpmDependencies(MIGRATION_CONFIG.devNpmDependenciesToRemove);
    if (dependenciesToRemove.length) {
      if (
        await confirmPrompt(
          'Do you want to remove the following possibly unnecessary NPM dependencies?' +
            '\n' +
            displayArrayAsList(dependenciesToRemove)
        )
      ) {
        removeNpmDependencies(dependenciesToRemove);
        removeNpmDependencies(devDependenciesToRemove, { devOnly: true });
        output.log({
          title: 'Unnecessary NPM dependencies removed successfully.',
        });
      }
    }

    // 6. Add / update NPM scripts
    // (skipped automatically if there is nothing to update)
    // ------------------------------------------------
    if (
      await confirmPrompt(
        'Would you like to update the `{ scripts }` in your `package.json`? All scripts using grafana-toolkit will be replaced.'
      )
    ) {
      updateNpmScripts();
      output.log({
        title: 'NPM scripts updated successfully.',
      });
    }

    // Guarantee that the package manager property is set in the package.json file if it is missing
    const packageManager = getPackageManagerWithFallback();
    writePackageManagerInPackageJson(packageManager);

    // Tidy package.json file so any changed fields are sorted as a
    // package manager would expect.
    cleanUpPackageJson();

    // 7. Summary
    // -------------

    const nextSteps = output.bulletList([
      `Run ${output.formatCode('yarn install')} to install the latest dependencies.`,
      'Check your tsconfig.json. You might need to update if you had a custom configuration.',
      'If you have a custom webpack configuration you might need to update it too.',
      `Run ${output.formatCode('yarn build')} and observe the output for any errors.`,
      'Test your plugin in grafana and make sure everything works as expected.',
    ]);

    output.success({
      title: 'Migration completed successfully.',
      body: [
        chalk.bold("What's next?"),
        ...nextSteps,
        'See instructions on how to customize your configuration here: https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations',
      ],
    });
  } catch (error) {
    if (error instanceof Error) {
      output.error({
        title: 'An error occurred while migrating the project.',
        body: [error.message],
      });
    } else {
      console.error(error);
    }
  }
};

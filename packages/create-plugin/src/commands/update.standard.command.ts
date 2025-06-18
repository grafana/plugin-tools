import chalk from 'chalk';
import { UDPATE_CONFIG } from '../constants.js';
import { output } from '../utils/utils.console.js';
import { getConfig } from '../utils/utils.config.js';
import { getOnlyExistingInCwd, removeFilesInCwd } from '../utils/utils.files.js';
import { updateGoSdkAndModules } from '../utils/utils.goSdk.js';
import { updateNpmScripts, updatePackageJson } from '../utils/utils.npm.js';
import { getPackageManagerFromUserAgent } from '../utils/utils.packageManager.js';
import { updateDotConfigFolder } from '../utils/utils.plugin.js';
import { CURRENT_APP_VERSION, getGrafanaRuntimeVersion } from '../utils/utils.version.js';

export const standardUpdate = async () => {
  const { packageManagerName } = getPackageManagerFromUserAgent();
  try {
    // Updating the plugin (.config/, NPM package dependencies, package.json scripts)
    // (More info on the why: https://docs.google.com/document/d/15dm4WV9v7Ga9Z_Hp3CJMf2D3meuTyEWqBc3omqiOksQ)
    // -------------------
    await updateDotConfigFolder();
    updateNpmScripts();
    updatePackageJson({
      onlyOutdated: true,
      ignoreGrafanaDependencies: false,
    });
    await updateGoSdkAndModules(process.cwd());

    const filesToRemove = getOnlyExistingInCwd(UDPATE_CONFIG.filesToRemove);

    // Standard update command rewrites the entire .config directory, so depending on the user's
    // choice of bundler we need to remove one of the directories.
    if (Boolean(getConfig().features.useExperimentalRspack)) {
      filesToRemove.push('./.config/webpack');
    } else {
      filesToRemove.push('./.config/rspack');
    }

    if (filesToRemove.length) {
      removeFilesInCwd(filesToRemove);
    }

    output.success({
      title: 'Update successful',
      body: output.bulletList([
        `@grafana packages version updated to: ${getGrafanaRuntimeVersion()}`,
        `@grafana/create-plugin version updated to: ${CURRENT_APP_VERSION}`,
      ]),
    });

    output.addHorizontalLine('gray');

    const nextStepsList = output.bulletList([
      `Run ${output.formatCode(`${packageManagerName} install`)} to install dependency updates`,
      `If you encounter breaking changes, refer to our migration guide: ${output.formatUrl('https://grafana.com/developers/plugin-tools/migration-guides/update-from-grafana-versions')}`,
    ]);
    const haveQuestionsList = output.bulletList([
      `Open an issue in ${output.formatUrl('https://github.com/grafana/plugin-tools')}`,
      `Ask a question in the community forum at ${output.formatUrl('https://community.grafana.com/c/plugin-development/30')}`,
      `Join our community slack channel at ${output.formatUrl('https://slack.grafana.com')}`,
    ]);

    output.log({
      title: 'Next steps:',
      body: [
        ...nextStepsList,
        '',
        `${chalk.bold('Do you have questions?')}`,
        '',
        `Please don't hesitate to reach out in one of the following ways:`,
        ...haveQuestionsList,
      ],
    });
  } catch (error) {
    if (error instanceof Error) {
      output.error({
        title: 'Something went wrong while updating your plugin.',
        body: [error.message],
      });
    } else {
      console.error(error);
    }
  }
};

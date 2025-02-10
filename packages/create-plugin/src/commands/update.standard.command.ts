import chalk from 'chalk';
import { UDPATE_CONFIG } from '../constants.js';
import { printBlueBox, printRedBox } from '../utils/utils.console.js';
import { getOnlyExistingInCwd, removeFilesInCwd } from '../utils/utils.files.js';
import { updateGoSdkAndModules } from '../utils/utils.goSdk.js';
import { updateNpmScripts, updatePackageJson } from '../utils/utils.npm.js';
import { getPackageManagerFromUserAgent } from '../utils/utils.packageManager.js';
import { updateDotConfigFolder } from '../utils/utils.plugin.js';
import { getGrafanaRuntimeVersion, getVersion } from '../utils/utils.version.js';

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
    if (filesToRemove.length) {
      removeFilesInCwd(filesToRemove);
    }

    printBlueBox({
      title: 'Update successful ✔',
      content: `${chalk.bold('@grafana/* package version:')} ${getGrafanaRuntimeVersion()}
${chalk.bold('@grafana/create-plugin version:')} ${getVersion()}

${chalk.bold.underline('Next steps:')}
- 1. Run ${chalk.bold(`${packageManagerName} install`)} to install the package updates
- 2. Check if you encounter any breaking changes
  (refer to our migration guide: https://grafana.com/developers/plugin-tools/migration-guides/update-from-grafana-versions/)
${chalk.bold('Do you have questions?')}
Please don't hesitate to reach out in one of the following ways:
- Open an issue in https://github.com/grafana/plugin-tools
- Ask a question in the community forum at https://community.grafana.com/c/plugin-development/30
- Join our community slack channel at https://slack.grafana.com/`,
    });
  } catch (error) {
    if (error instanceof Error) {
      printRedBox({
        title: 'Something went wrong while updating your plugin.',
        content: error.message,
      });
    } else {
      console.error(error);
    }
  }
};

import { machine } from 'node:os';
import chalk from 'chalk';
import { TemplateData } from '../../types.js';
import { output } from '../../utils/utils.console.js';
import { normalizeId } from '../../utils/utils.handlebars.js';
import { getPackageManagerFromUserAgent } from '../../utils/utils.packageManager.js';

export function printGenerateSuccessMessage(answers: TemplateData) {
  const directory = normalizeId(answers.pluginName, answers.orgName, answers.pluginType);
  const { packageManagerName } = getPackageManagerFromUserAgent();

  const commands = output.bulletList([
    output.formatCode(`cd ./${directory}`),
    `${output.formatCode(packageManagerName + ' install')} ${chalk.dim('to install frontend dependencies')}`,
    `${output.formatCode(packageManagerName + ' exec playwright install chromium')} ${chalk.dim('to install e2e test dependencies')}`,
    `${output.formatCode(packageManagerName + ' run dev')} ${chalk.dim('to build (and watch) the plugin frontend code')}`,
    ...(answers.hasBackend
      ? [
          `${getBackendCmd()} ${chalk.dim('to build the plugin backend code. Rerun this command every time you edit your backend files')}`,
        ]
      : []),
    `${output.formatCode('docker compose up')} ${chalk.dim('to start a grafana development server')}`,
    `Open ${output.formatUrl('http://localhost:3000')} ${chalk.dim('in your browser to begin developing your plugin')}`,
  ]);

  output.log({
    title: 'Next steps:',
    body: [
      'Run the following commands to get started:',
      ...commands,
      '',
      chalk.italic(
        `Note: We strongly recommend creating a new Git repository by running ${output.formatCode('git init')} in ./${directory} before continuing.`
      ),
      '',
      `   Learn more about Grafana Plugin Development at ${output.formatUrl('https://grafana.com/developers/plugin-tools')}`,
    ],
  });
}

function getBackendCmd() {
  const platform = machine();
  if (platform === 'arm64') {
    return output.formatCode('mage -v build:linuxARM64');
  }

  return output.formatCode('mage -v build:linux');
}

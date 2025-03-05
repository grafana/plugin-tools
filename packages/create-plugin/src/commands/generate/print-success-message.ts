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
    `cd ./${directory}`,
    `${packageManagerName} install ${chalk.dim('to install frontend dependencies')}`,
    `${packageManagerName} exec playwright install chromium ${chalk.dim('to install e2e test dependencies')}`,
    `${packageManagerName} run dev ${chalk.dim('to build (and watch) the plugin frontend code')}`,
    ...(answers.hasBackend
      ? [
          `${getBackendCmd()} ${chalk.dim('to build the plugin backend code. Rerun this command every time you edit your backend files')}`,
        ]
      : []),
    `docker compose up ${chalk.dim('to start a grafana development server')}`,
    `Open http://localhost:3000 in your browser ${chalk.dim('to create a dashboard and begin developing your plugin')}`,
  ]);

  output.log({
    withPrefix: false,
    title: `Next steps:`,
    color: 'cyan',
    body: [
      'Run the following commands to get started:',
      ...commands,
      '',
      chalk.italic(
        `Note: We strongly recommend creating a new Git repository by running ${chalk.bold('git init')} in ./${directory} before continuing.`
      ),
      '',
      `   Learn more about Grafana Plugin Development at https://grafana.com/developers/plugin-tools`,
    ],
  });
}

function getBackendCmd() {
  const platform = machine();
  if (platform === 'arm64') {
    return '`mage -v build:linuxARM64`';
  }

  return '`mage -v build:linux`';
}

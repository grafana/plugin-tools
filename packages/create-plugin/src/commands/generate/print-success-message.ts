import { machine } from 'node:os';
import path from 'node:path';
import { styleText } from 'node:util';
import { TemplateData } from '../../types.js';
import { output } from '../../utils/utils.console.js';
import { normalizeId } from '../../utils/utils.handlebars.js';
import { getPackageManagerExecCmd, getPackageManagerFromUserAgent } from '../../utils/utils.packageManager.js';

export function printGenerateSuccessMessage(answers: TemplateData) {
  const directory = normalizeId(answers.pluginName, answers.orgName, answers.pluginType);
  const { packageManagerName } = getPackageManagerFromUserAgent();

  const commands = output.bulletList([
    output.formatCode(`cd ./${directory}`),
    `${output.formatCode(packageManagerName + ' install')} ${styleText(['dim'], 'to install frontend dependencies')}`,
    `${output.formatCode(packageManagerName + ' exec playwright install chromium')} ${styleText(['dim'], 'to install e2e test dependencies')}`,
    `${output.formatCode(packageManagerName + ' run dev')} ${styleText(['dim'], 'to build (and watch) the plugin frontend code')}`,
    ...(answers.hasBackend
      ? [
          `${getBackendCmd()} ${styleText(['dim'], 'to build the plugin backend code. Rerun this command every time you edit your backend files')}`,
        ]
      : []),
    `${output.formatCode('docker compose up')} ${styleText(['dim'], 'to start a grafana development server')}`,
    `Open ${output.formatUrl('http://localhost:3000')} ${styleText(['dim'], 'in your browser to begin developing your plugin')}`,
  ]);

  output.log({
    title: 'Next steps:',
    body: [
      'Run the following commands to get started:',
      ...commands,
      '',
      styleText(
        ['italic'],
        `Note: We strongly recommend creating a new Git repository by running ${output.formatCode('git init')} in ./${directory} before continuing.`
      ),
      '',
      `   Learn more about Grafana Plugin Development at ${output.formatUrl('https://grafana.com/developers/plugin-tools')}`,
    ],
  });
}

export function printMonorepoCreatedMessage({ templateData, root }: { templateData: TemplateData; root: string }) {
  const { packageManagerName, packageManagerVersion } = templateData;
  const rootDir = path.relative(process.cwd(), root) || '.';

  const commands = output.bulletList([
    output.formatCode(`cd ./${rootDir}`),
    `${output.formatCode(getPackageManagerExecCmd(packageManagerName, packageManagerVersion))} ${styleText(['dim'], 'to add your first plugin')}`,
  ]);

  output.log({
    title: 'Next steps:',
    body: [
      'Run the following commands to add a plugin:',
      ...commands,
      '',
      styleText(
        ['italic'],
        `Note: We strongly recommend creating a new Git repository by running ${output.formatCode('git init')} in ./${rootDir} before continuing.`
      ),
      '',
      `   Learn more about Grafana Plugin Development at ${output.formatUrl('https://grafana.com/developers/plugin-tools')}`,
    ],
  });
}

export function printMonorepoSuccessMessage({
  templateData,
  root,
  pluginDir,
}: {
  templateData: TemplateData;
  root: string;
  pluginDir: string;
}) {
  const { packageManagerName } = templateData;
  const rootDir = path.relative(process.cwd(), root) || '.';

  const commands = output.bulletList([
    ...(rootDir === '.' ? [] : [output.formatCode(`cd ./${rootDir}`)]),
    `${output.formatCode(packageManagerName + ' install')} ${styleText(['dim'], 'to install dependencies for every plugin from the repository root')}`,
    `${output.formatCode(`cd ${pluginDir} && ${packageManagerName} run dev`)} ${styleText(['dim'], 'to build (and watch) the plugin frontend code')}`,
    ...(templateData.hasBackend
      ? [`${getBackendCmd()} ${styleText(['dim'], `in ${pluginDir} to build the plugin backend code`)}`]
      : []),
    `${output.formatCode('docker compose up')} ${styleText(['dim'], 'from the repository root to start one grafana server with every plugin')}`,
    `Open ${output.formatUrl('http://localhost:3000')} ${styleText(['dim'], 'in your browser to begin developing your plugin')}`,
  ]);

  output.log({
    title: 'Next steps:',
    body: [
      'Run the following commands to get started:',
      ...commands,
      '',
      `   Learn more about Grafana Plugin Development at ${output.formatUrl('https://grafana.com/developers/plugin-tools')}`,
    ],
  });
}

export function getBackendCmd() {
  const platform = machine();
  if (platform === 'arm64') {
    return output.formatCode('mage -v build:linuxARM64');
  }

  return output.formatCode('mage -v build:linux');
}

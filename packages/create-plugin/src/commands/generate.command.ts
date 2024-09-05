import chalk from 'chalk';
import { glob } from 'glob';
import minimist from 'minimist';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EXTRA_TEMPLATE_VARIABLES, IS_DEV, PLUGIN_TYPES, TEMPLATE_PATHS } from '../constants.js';
import { TemplateData } from '../types.js';
import { printError, printWarning } from '../utils/utils.console.js';
import { directoryExists, getExportFileName, isFile } from '../utils/utils.files.js';
import { updateGoSdkAndModules } from '../utils/utils.goSdk.js';
import { configureYarn } from '../utils/utils.packageManager.js';
import { getExportPath } from '../utils/utils.path.js';
import { prettifyFiles } from '../utils/utils.prettifyFiles.js';
import { getTemplateData, renderTemplateFromFile } from '../utils/utils.templates.js';
import { printGenerateSuccessMessage } from './generate/print-success-message.js';
import { promptUser } from './generate/prompt-user.js';

export const generate = async (argv: minimist.ParsedArgs) => {
  const answers = await promptUser(argv);
  const templateData = getTemplateData(answers);
  const exportPath = getExportPath(templateData.pluginName, templateData.orgName, templateData.pluginType);
  const exportPathExists = await directoryExists(exportPath);
  const exportPathIsPopulated = exportPathExists ? (await readdir(exportPath)).length > 0 : false;

  // Prevent generation from writing to an existing, populated directory unless in DEV mode.
  if (exportPathIsPopulated && !IS_DEV) {
    printError(`**Aborting plugin scaffold. '${exportPath}' exists and contains files.**`);
    process.exit(1);
  }
  // This is only possible when a user passes both flags via the command line.
  if (answers.hasBackend && answers.pluginType === PLUGIN_TYPES.panel) {
    printWarning(`Backend ignored as incompatible with plugin type: ${PLUGIN_TYPES.panel}.`);
  }

  const actions = getTemplateActions({ templateData, exportPath });
  const failures = await generateFiles({ actions });
  const changes = [
    `Scaffolded ${templateData.pluginId} ${templateData.pluginType} plugin ${
      templateData.hasBackend ? '(with Go backend)' : ''
    }`,
    'Added basic E2E test (Playwright)',
    `${provisioningMsg[templateData.pluginType]}`,
    'Configured development environment (Docker)',
    'Added default GitHub actions for CI, releases and Grafana compatibility',
  ];
  console.log('');
  changes.forEach((change) => {
    console.log(`${chalk.green('✔︎')} ${change}`);
  });

  failures.forEach((failure) => {
    printError(`${failure.error}`);
  });

  if (templateData.packageManagerName === 'yarn') {
    await execPostScaffoldFunction(configureYarn, exportPath, templateData.packageManagerVersion);
  }

  if (templateData.hasBackend) {
    await execPostScaffoldFunction(updateGoSdkAndModules, exportPath);
  }

  await execPostScaffoldFunction(prettifyFiles, { targetPath: exportPath });
  console.log('\n');
  printGenerateSuccessMessage(templateData);
};

type TemplateAction = {
  templateFile: string;
  path: string;
  data: TemplateData;
};

function getTemplateActions({ exportPath, templateData }: { exportPath: string; templateData: any }) {
  const commonActions = getActionsForTemplateFolder({
    folderPath: TEMPLATE_PATHS.common,
    exportPath,
    templateData,
  });

  // Copy over files from the plugin type specific folder, e.g. "templates/app" for "app" plugins ("app" | "panel" | "datasource").
  const pluginTypeSpecificActions = getActionsForTemplateFolder({
    folderPath: TEMPLATE_PATHS[templateData.pluginType],
    exportPath,
    templateData,
  });

  // Copy over backend-specific files (if selected)
  const backendFolderPath = templateData.isAppType ? TEMPLATE_PATHS.backendApp : TEMPLATE_PATHS.backend;
  const backendActions = templateData.hasBackend
    ? getActionsForTemplateFolder({ folderPath: backendFolderPath, exportPath, templateData })
    : [];

  // Common, pluginType and backend actions can contain different templates for the same destination.
  // This filtering removes the duplicate file additions to make sure the correct template is scaffolded.
  // Note that the order is reversed so backend > pluginType > common
  const pluginActions = [...backendActions, ...pluginTypeSpecificActions, ...commonActions].reduce<TemplateAction[]>(
    (acc, file) => {
      const actionExists = acc.find((f) => f.path === file.path);
      // return early to prevent duplicate file additions
      if (actionExists) {
        return acc;
      }
      acc.push(file);
      return acc;
    },
    []
  );

  // Copy over Github workflow files
  const ciWorkflowActions = getActionsForTemplateFolder({
    folderPath: TEMPLATE_PATHS.ciWorkflows,
    exportPath: path.join(exportPath, '.github'),
    templateData,
  });

  return [...pluginActions, ...ciWorkflowActions];
}

function getActionsForTemplateFolder({
  folderPath,
  exportPath,
  templateData,
}: {
  folderPath: string;
  exportPath: string;
  templateData: TemplateData;
}) {
  let files = glob.sync(`${folderPath}/**`, { dot: true });

  // The npmrc file is only useful for `pnpm` settings. We can remove it for other package managers.
  if (templateData.packageManagerName !== 'pnpm') {
    files = files.filter((file) => path.basename(file) !== 'npmrc');
  }

  // filter out frontend bundler based on user choice
  files = files.filter((file) => {
    if (file.includes('webpack') && templateData.useExperimentalRspack) {
      return false;
    }
    if (file.includes('rspack') && !templateData.useExperimentalRspack) {
      return false;
    }
    return true;
  });

  function getFileExportPath(f: string) {
    return path.relative(folderPath, path.dirname(f));
  }

  return files.filter(isFile).map<TemplateAction>((f) => ({
    templateFile: f,
    // The target path where the compiled template is saved to
    path: path.join(exportPath, getFileExportPath(f), getExportFileName(f)),
    data: {
      ...EXTRA_TEMPLATE_VARIABLES,
      ...templateData,
    },
  }));
}

async function generateFiles({ actions }: { actions: any[] }) {
  const failures = [];
  for (const action of actions) {
    try {
      const rootDir = path.dirname(action.path);
      const pathExists = await directoryExists(rootDir);
      if (!pathExists) {
        await mkdir(rootDir, { recursive: true });
      }

      const rendered = renderTemplateFromFile(action.templateFile, action.data);
      await writeFile(action.path, rendered);
    } catch (error) {
      let message;
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }
      failures.push({
        path: action.path,
        error: message,
      });
    }
  }
  return failures;
}

type AsyncFunction<T> = (...args: any[]) => Promise<T>;

async function execPostScaffoldFunction<T>(fn: AsyncFunction<T>, ...args: Parameters<AsyncFunction<T>>) {
  try {
    const resultMsg = await fn.apply(undefined, args);
    if (resultMsg) {
      console.log(`${chalk.green('✔︎')} ${resultMsg}`);
    }
  } catch (error) {
    printError(`${error}`);
  }
}

const provisioningMsg = {
  [PLUGIN_TYPES.app]: 'Set up provisioning for app',
  [PLUGIN_TYPES.datasource]: 'Set up provisioning for data source instance',
  [PLUGIN_TYPES.panel]: 'Set up provisioning for basic dashboard and TestData data source instance',
  [PLUGIN_TYPES.scenes]: 'Set up provisioning for app and TestData data source instance',
};

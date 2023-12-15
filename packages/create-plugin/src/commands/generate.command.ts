// import path from 'path';
import minimist from 'minimist';
// @ts-ignore
import { Confirm, Input, Select } from 'enquirer';
import glob from 'glob';
import { existsSync, lstatSync } from 'node:fs';
import path from 'path';
import { EXTRA_TEMPLATE_VARIABLES, IS_DEV, PLUGIN_TYPES, TEMPLATE_PATHS } from '../constants';
import { getConfig } from '../utils/utils.config';
import { getExportFileName } from '../utils/utils.files';
import { normalizeId } from '../utils/utils.handlebars';
import { getPackageManagerFromUserAgent, getPackageManagerInstallCmd } from '../utils/utils.packageManager';
import { getExportPath } from '../utils/utils.path';
import { getVersion } from '../utils/utils.version';
import { TemplateData } from './types';
import { renderTemplateFromFile } from '../utils/utils.templates';
import { mkdir, writeFile } from 'node:fs/promises';
import { updateGoSdkAndModules } from './generate-actions/update-go-sdk-and-packages';
import { prettifyFiles } from './generate-actions/prettify-files';
import { printGenerateSuccessMessage } from './generate-actions/print-success-message';
import { printSuccessMessage } from '../utils/utils.console';

const messages = {
  generateFilesSuccess: `Successfully generated plugin files`,
  updateGoSdkSuccess: `Successfully updated backend files`,
  prettifySuccess: `Successfully formatted frontend files`,
};

export const generate = async (argv: minimist.ParsedArgs) => {
  const answers = await promptUser(argv);
  const templateData = getTemplateData(answers);
  const exportPath = getExportPath(answers.pluginName, answers.orgName, answers.pluginType);
  const templateActions = getTemplateActions({ templateData, exportPath });
  const { pluginName, orgName, pluginType } = answers;
  await generateFiles({ actions: templateActions, templateData });
  printSuccessMessage(messages.generateFilesSuccess);
  // @ts-ignore
  await updateGoSdkAndModules({ pluginName, orgName, pluginType });
  printSuccessMessage(messages.updateGoSdkSuccess);
  // @ts-ignore
  await prettifyFiles({ pluginName, orgName, pluginType });
  printSuccessMessage(messages.prettifySuccess);
  // @ts-ignore
  console.log(printGenerateSuccessMessage(answers));
};

async function promptUser(argv: minimist.ParsedArgs) {
  const answers: Record<string, any> = {};

  for (const promptDefinition of prompts) {
    const { name, type, message, validate, initial, choices } = promptDefinition;
    if (argv[name]) {
      answers[name] = argv[name];
    } else {
      let prompt;

      if (type === 'input') {
        prompt = new Input({
          name,
          message,
          validate,
          initial,
        });
      }

      if (type === 'select') {
        prompt = new Select({
          name,
          message,
          choices,
        });
      }

      const promptResult = await prompt.run();
      answers[name] = promptResult;
    }
  }

  if (answers.pluginType !== PLUGIN_TYPES.panel) {
    const hasBackendPrompt = {
      name: 'hasBackend',
      message: 'Do you want a backend part of your plugin?',
      initial: false,
    };
    if (argv[hasBackendPrompt.name]) {
      answers[hasBackendPrompt.name] = argv[hasBackendPrompt.name];
    } else {
      const prompt = new Confirm(hasBackendPrompt);
      const promptResult = await prompt.run();

      answers[hasBackendPrompt.name] = promptResult;
    }
  }

  for (const promptDefinition of workflowPrompts) {
    const { name } = promptDefinition;
    if (argv[name]) {
      answers[name] = argv[name];
    } else {
      const prompt = new Confirm(promptDefinition);

      const promptResult = await prompt.run();
      answers[name] = promptResult;
    }
  }

  return answers;
}

function getTemplateData(answers: Record<string, any>) {
  const { pluginName, orgName, pluginType } = answers;
  const { features } = getConfig();
  const currentVersion = getVersion();
  const pluginId = normalizeId(pluginName, orgName, pluginType);
  // Support the users package manager of choice.
  const { packageManagerName, packageManagerVersion } = getPackageManagerFromUserAgent();
  const packageManagerInstallCmd = getPackageManagerInstallCmd(packageManagerName);
  const isAppType = pluginType === PLUGIN_TYPES.app || pluginType === PLUGIN_TYPES.scenes;
  const templateData: TemplateData = {
    ...answers,
    pluginId,
    packageManagerName,
    packageManagerInstallCmd,
    packageManagerVersion,
    isAppType,
    isNPM: packageManagerName === 'npm',
    version: currentVersion,
    bundleGrafanaUI: features.bundleGrafanaUI,
  };

  return templateData;
}

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
  const pluginActions = [...backendActions, ...pluginTypeSpecificActions, ...commonActions].reduce((acc, file) => {
    const actionExists = acc.find((f) => f.path === file.path);
    // return early to prevent duplicate file additions
    if (actionExists) {
      return acc;
    }
    acc.push(file);
    return acc;
  }, []);

  // Copy over Github workflow files (if selected)
  const ciWorkflowActions = templateData.hasGithubWorkflows
    ? getActionsForTemplateFolder({
        folderPath: TEMPLATE_PATHS.ciWorkflows,
        exportPath,
        templateData,
      })
    : [];

  const isCompatibleWorkflowActions = templateData.hasGithubLevitateWorkflow
    ? getActionsForTemplateFolder({
        folderPath: TEMPLATE_PATHS.isCompatibleWorkflow,
        exportPath,
        templateData,
      })
    : [];

  return [...pluginActions, ...ciWorkflowActions, ...isCompatibleWorkflowActions];
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

  function getExportPath(f: string) {
    return path.relative(folderPath, path.dirname(f));
  }

  return files.filter(isFile).map((f) => ({
    templateFile: f,
    // The target path where the compiled template is saved to
    path: path.join(exportPath, getExportPath(f), getExportFileName(f)),
    // Support overriding files in development for overriding "generated" plugins.
    force: IS_DEV,
    // We would still like to scaffold as many files as possible even if one fails
    abortOnFail: false,
    data: {
      ...EXTRA_TEMPLATE_VARIABLES,
      ...templateData,
    },
  }));
}

function isFile(path: string) {
  try {
    return lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}

// TODO:
// - Handle modify commands (e.g readme generation)
// - Handle bruteforce action.force to overwrite files / not overwrite files
// - Handle abort on fail???
async function generateFiles({ actions, templateData }: { actions: any[]; templateData: TemplateData }) {
  for (const action of actions) {
    const rootDir = path.dirname(action.path);
    if (!existsSync(rootDir)) {
      await mkdir(rootDir, { recursive: true });
    }

    const rendered = renderTemplateFromFile(action.templateFile, templateData);
    await writeFile(action.path, rendered);
  }
}

const prompts = [
  {
    name: 'pluginName',
    type: 'input',
    message: 'What is going to be the name of your plugin?',
    validate: (value: string) => {
      if (/.+/.test(value)) {
        return true;
      }
      return 'Plugin name is required';
    },
  },
  {
    name: 'orgName',
    type: 'input',
    message: 'What is the organization name of your plugin?',
    validate: (value: string) => {
      if (/.+/.test(value)) {
        return true;
      }
      return 'Organization name is required';
    },
  },
  {
    name: 'pluginDescription',
    type: 'input',
    message: 'How would you describe your plugin?',
    initial: '',
  },
  {
    name: 'pluginType',
    type: 'select',
    choices: [PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel, PLUGIN_TYPES.scenes],
    message: 'What type of plugin would you like?',
  },
];

const workflowPrompts = [
  {
    name: 'hasGithubWorkflows',
    type: 'confirm',
    message: 'Do you want to add Github CI and Release workflows?',
    initial: false,
  },
  {
    name: 'hasGithubLevitateWorkflow',
    type: 'confirm',
    message: 'Do you want to add a Github workflow for automatically checking "Grafana API compatibility" on PRs?',
    initial: false,
  },
];

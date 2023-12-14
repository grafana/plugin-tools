// import path from 'path';
import minimist from 'minimist';
// @ts-ignore
import { Confirm, Input, Select } from 'enquirer';
import glob from 'glob';
import { lstatSync } from 'node:fs';
import path from 'path';
import { EXTRA_TEMPLATE_VARIABLES, IS_DEV, PLUGIN_TYPES, TEMPLATE_PATHS } from '../constants';
import { getConfig } from '../utils/utils.config';
import { getExportFileName } from '../utils/utils.files';
import { normalizeId } from '../utils/utils.handlebars';
import { getPackageManagerFromUserAgent, getPackageManagerInstallCmd } from '../utils/utils.packageManager';
import { getExportPath } from '../utils/utils.path';
import { getVersion } from '../utils/utils.version';
import { TemplateData } from './types';

export const generate = async (argv: minimist.ParsedArgs) => {
  console.log(argv);
  const answers = await promptUser(argv);
  const templateData = getTemplateData(answers);
  const exportPath = getExportPath(answers.pluginName, answers.orgName, answers.pluginType);
  const templateActions = getTemplateActions({ templateData, exportPath });
  console.log({ exportPath, templateAction: templateActions[0] });
};

async function promptUser(argv: minimist.ParsedArgs) {
  const answers: Record<string, any> = {};

  for (const promptDefinition of prompts) {
    const { name, type, message, validate, default: defaultValue, choices } = promptDefinition;
    if (argv[name]) {
      answers[name] = argv[name];
    } else {
      let prompt;

      if (type === 'input') {
        prompt = new Input({
          name,
          message,
          validate,
          initial: defaultValue,
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

function getTemplateActions({ exportPath, templateData }: any) {
  const commonActions = getActionsForTemplateFolder({
    folderPath: TEMPLATE_PATHS.common,
    exportPath,
    templateData,
  });
  return commonActions;
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
    type: 'add',
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
    default: '',
  },
  {
    name: 'pluginType',
    type: 'select',
    choices: [PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel, PLUGIN_TYPES.scenes],
    message: 'What type of plugin would you like?',
  },
];

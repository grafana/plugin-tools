import type { NodePlopAPI } from 'plop';
import type { ModifyActionConfig } from 'node-plop';
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { EXPORT_PATH_PREFIX, IS_DEV, TEMPLATE_PATHS, PLUGIN_TYPES } from './constants';

export default function (plop: NodePlopAPI) {
  plop.setGenerator('create-plugin', {
    description: 'used to scaffold a grafana plugin',
    prompts: [
      {
        name: 'pluginName',
        type: 'input',
        message: 'What is going to be the name of your plugin?',
      },
      {
        name: 'orgName',
        type: 'input',
        message: 'What is the organization name of your plugin?',
        default: 'my-org',
      },
      {
        name: 'pluginDescription',
        type: 'input',
        message: 'How would you describe your plugin?',
        default: '<plugin description>',
      },
      {
        name: 'pluginType',
        type: 'list',
        choices: [PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel],
        message: 'What kind of plugin would you like? ',
      },
      {
        name: 'hasBackend',
        type: 'confirm',
        message: 'Do you want a backend part of your plugin?',
        default: false,
      },
      {
        name: 'hasGithubWorkflows',
        type: 'confirm',
        message: 'Do you want to add Github workflows?',
        default: false,
      },
    ],
    actions: function ({ pluginType, hasBackend, hasGithubWorkflows }) {
      const commonActions = getActionsForTemplateFolder(TEMPLATE_PATHS.common);
      const pluginTypeSpecificActions = getActionsForTemplateFolder(TEMPLATE_PATHS[pluginType]);
      const backendActions = hasBackend ? getActionsForTemplateFolder(TEMPLATE_PATHS.backend) : [];
      const workflowActions = hasGithubWorkflows ? getActionsForTemplateFolder(TEMPLATE_PATHS.workflows) : [];
      const modifyReadmeActions = getReadmeActions(hasBackend);

      return [
        ...commonActions,
        ...pluginTypeSpecificActions,
        ...backendActions,
        ...workflowActions,
        ...modifyReadmeActions,
      ];
    },
  });
}

function getReadmeActions(hasBackend: boolean): ModifyActionConfig[] {
  return [getGettingStartedReadmeAction(hasBackend)];
}

function getGettingStartedReadmeAction(hasBackend: boolean): ModifyActionConfig {
  const pattern = /(-- APPEND GETTING STARTED HERE --)/gi;
  const template = '_templates/GettingStarted.md';
  const backendTemplateFile = path.join(TEMPLATE_PATHS.backend, template);
  const commonTemplateFile = path.join(TEMPLATE_PATHS.common, template);
  const templateFile = hasBackend ? backendTemplateFile : commonTemplateFile;

  return {
    type: 'modify',
    path: path.join(EXPORT_PATH_PREFIX, 'README.md'),
    pattern,
    template: undefined,
    templateFile,
  };
}

// TODO<use Plop action `addMany` instead>
function getActionsForTemplateFolder(folderPath: string) {
  const files = glob.sync(`${folderPath}/**`, { dot: true, ignore: [`${folderPath}/_templates/**`] });
  const getExportFileName = (f: string) => (path.extname(f) === '.hbs' ? path.basename(f, '.hbs') : path.basename(f));
  const getExportPath = (f: string) => path.relative(folderPath, path.dirname(f));

  return files.filter(isFile).map((f) => ({
    type: 'add',
    templateFile: f,
    // The target path where the compiled template is saved to
    path: path.join(EXPORT_PATH_PREFIX, getExportPath(f), getExportFileName(f)),
    // We would like to override generated files in development mode
    force: IS_DEV,
    // We would still like to scaffold as many files as possible even if one fails
    abortOnFail: false,
  }));
}

function isFile(path) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}

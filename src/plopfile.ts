import type { NodePlopAPI } from 'plop';
import type { ModifyActionConfig } from 'node-plop';
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { EXPORT_PATH_PREFIX, IS_DEV, TEMPLATE_PATHS, PARTIALS_DIR, PLUGIN_TYPES } from './constants';
import { ifEq } from './plopHelpers';

export default function (plop: NodePlopAPI) {
  plop.setHelper('if_eq', ifEq);

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
      // Copy over files that are shared between plugins types
      const commonActions = getActionsForTemplateFolder(TEMPLATE_PATHS.common);

      // Copy over files from the plugin type specific folder, e.g. "tempaltes/app" for "app" plugins ("app" | "panel" | "datasource").
      const pluginTypeSpecificActions = getActionsForTemplateFolder(TEMPLATE_PATHS[pluginType]);

      // Copy over backend-specific files (if selected)
      const backendActions = hasBackend ? getActionsForTemplateFolder(TEMPLATE_PATHS.backend) : [];

      // Copy over Github workflow files (if selected)
      const workflowActions = hasGithubWorkflows ? getActionsForTemplateFolder(TEMPLATE_PATHS.workflows) : [];

      // Replace conditional bits in the Readme files
      const readmeActions = getActionsForReadme();

      return [...commonActions, ...pluginTypeSpecificActions, ...backendActions, ...workflowActions, ...readmeActions];
    },
  });
}

function getActionsForReadme(): ModifyActionConfig[] {
  return [
    replacePatternWithTemplateInReadme('-- INSERT FRONTEND GETTING STARTED --', 'frontend-getting-started.md'),
    replacePatternWithTemplateInReadme('-- INSERT BACKEND GETTING STARTED --', 'backend-getting-started.md'),
  ];
}

function replacePatternWithTemplateInReadme(pattern: string, partialsFile: string): ModifyActionConfig {
  return {
    type: 'modify',
    path: path.join(EXPORT_PATH_PREFIX, 'README.md'),
    pattern,
    template: undefined,
    templateFile: path.join(PARTIALS_DIR, partialsFile),
  };
}

// TODO<use Plop action `addMany` instead>
function getActionsForTemplateFolder(folderPath: string) {
  const files = glob.sync(`${folderPath}/**`, { dot: true });
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

import type { NodePlopAPI, ModifyActionConfig } from 'plop';
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { ifEq, normalizeId } from '../utils/utils.handlebars';
import {
  IS_DEV,
  TEMPLATE_PATHS,
  PARTIALS_DIR,
  PLUGIN_TYPES,
  EXTRA_TEMPLATE_VARIABLES,
  DEV_EXPORT_DIR,
} from '../constants';

type CliArgs = {
  pluginName: string;
  pluginDescription: string;
  orgName: string;
  pluginType: PLUGIN_TYPES;
  hasBackend: boolean;
  hasGithubWorkflows: boolean;
  hasGithubLevitateWorkflow: boolean;
};

// Plopfile API documentation: https://plopjs.com/documentation/#plopfile-api
export default function (plop: NodePlopAPI) {
  plop.setHelper('if_eq', ifEq);
  plop.setHelper('normalize_id', normalizeId);

  plop.setGenerator('create-plugin', {
    description: 'used to scaffold a grafana plugin',
    prompts: [
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
        message: 'Do you want to add Github CI and Release workflows?',
        default: false,
      },
      {
        name: 'hasGithubLevitateWorkflow',
        type: 'confirm',
        message: 'Do you want to add a Github workflow for automatically checking "Grafana API compatibility" on PRs?',
        default: false,
      },
    ],
    actions: function ({
      pluginName,
      orgName,
      pluginType,
      hasBackend,
      hasGithubWorkflows,
      hasGithubLevitateWorkflow,
    }: CliArgs) {
      const exportPath = getExportPath(pluginName, orgName, pluginType);
      console.log(exportPath);
      // Copy over files that are shared between plugins types
      const commonActions = getActionsForTemplateFolder({ folderPath: TEMPLATE_PATHS.common, exportPath });

      // Copy over files from the plugin type specific folder, e.g. "tempaltes/app" for "app" plugins ("app" | "panel" | "datasource").
      const pluginTypeSpecificActions = getActionsForTemplateFolder({
        folderPath: TEMPLATE_PATHS[pluginType],
        exportPath,
      });

      // Copy over backend-specific files (if selected)
      const backendActions = hasBackend
        ? getActionsForTemplateFolder({ folderPath: TEMPLATE_PATHS.backend, exportPath })
        : [];

      // Copy over Github workflow files (if selected)
      const ciWorkflowActions = hasGithubWorkflows
        ? getActionsForTemplateFolder({ folderPath: TEMPLATE_PATHS.ciWorkflows, exportPath })
        : [];

      const isCompatibleWorkflowActions = hasGithubLevitateWorkflow
        ? getActionsForTemplateFolder({ folderPath: TEMPLATE_PATHS.isCompatibleWorkflow, exportPath })
        : [];

      // Replace conditional bits in the Readme files
      const readmeActions = getActionsForReadme({ exportPath });

      return [
        ...commonActions,
        ...pluginTypeSpecificActions,
        ...backendActions,
        ...ciWorkflowActions,
        ...readmeActions,
        ...isCompatibleWorkflowActions,
      ];
    },
  });
}

function getActionsForReadme({ exportPath }: { exportPath: string }): ModifyActionConfig[] {
  return [
    replacePatternWithTemplateInReadme(
      '-- INSERT FRONTEND GETTING STARTED --',
      'frontend-getting-started.md',
      exportPath
    ),
    replacePatternWithTemplateInReadme(
      '-- INSERT BACKEND GETTING STARTED --',
      'backend-getting-started.md',
      exportPath
    ),
  ];
}

function replacePatternWithTemplateInReadme(
  pattern: string,
  partialsFile: string,
  exportPath: string
): ModifyActionConfig {
  return {
    type: 'modify',
    path: path.join(exportPath, 'README.md'),
    pattern,
    // @ts-ignore
    template: undefined,
    templateFile: path.join(PARTIALS_DIR, partialsFile),
    data: EXTRA_TEMPLATE_VARIABLES,
  };
}

// TODO<use Plop action `addMany` instead>
function getActionsForTemplateFolder({ folderPath, exportPath }: { folderPath: string; exportPath: string }) {
  const files = glob.sync(`${folderPath}/**`, { dot: true });
  const getExportFileName = (f: string) => (path.extname(f) === '.hbs' ? path.basename(f, '.hbs') : path.basename(f));
  const getExportPath = (f: string) => path.relative(folderPath, path.dirname(f));

  return files.filter(isFile).map((f) => ({
    type: 'add',
    templateFile: f,
    // The target path where the compiled template is saved to
    path: path.join(exportPath, getExportPath(f), getExportFileName(f)),
    // We would like to override generated files in development mode
    force: IS_DEV,
    // We would still like to scaffold as many files as possible even if one fails
    abortOnFail: false,
    data: EXTRA_TEMPLATE_VARIABLES,
  }));
}

function isFile(path: string) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}

function getExportPath(pluginName: string, orgName: string, pluginType: PLUGIN_TYPES) {
  if (IS_DEV) {
    return DEV_EXPORT_DIR;
  } else {
    return path.join(process.cwd(), normalizeId(pluginName, orgName, pluginType));
  }
}

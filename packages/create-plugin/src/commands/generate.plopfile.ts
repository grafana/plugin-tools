import fs from 'fs';
import glob from 'glob';
import path from 'path';
import type { ModifyActionConfig, NodePlopAPI } from 'plop';
import { EXTRA_TEMPLATE_VARIABLES, IS_DEV, PARTIALS_DIR, PLUGIN_TYPES, TEMPLATE_PATHS } from '../constants';
import { ifEq, normalizeId } from '../utils/utils.handlebars';
import { getExportPath } from '../utils/utils.path';
import { printGenerateSuccessMessage } from './generate-actions/print-success-message';
import { updateGoSdkAndModules } from './generate-actions/update-go-sdk-and-packages';
import { CliArgs } from './types';

// Plopfile API documentation: https://plopjs.com/documentation/#plopfile-api
export default function (plop: NodePlopAPI) {
  plop.setHelper('if_eq', ifEq);
  plop.setHelper('normalize_id', normalizeId);

  plop.setActionType('printSuccessMessage', printGenerateSuccessMessage);
  plop.setActionType('updateGoSdkAndModules', updateGoSdkAndModules);

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
        message: 'What type of plugin would you like?',
      },
      {
        name: 'hasBackend',
        type: 'confirm',
        message: 'Do you want a backend part of your plugin?',
        default: false,
        when: (answers: CliArgs) => answers.pluginType !== PLUGIN_TYPES.panel,
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
      const pluginId = normalizeId(pluginName, orgName, pluginType);

      // Copy over files that are shared between plugins types
      const commonActions = getActionsForTemplateFolder({
        folderPath: TEMPLATE_PATHS.common,
        exportPath,
        templateData: { pluginId },
      });

      // Copy over files from the plugin type specific folder, e.g. "templates/app" for "app" plugins ("app" | "panel" | "datasource").
      const pluginTypeSpecificActions = getActionsForTemplateFolder({
        folderPath: TEMPLATE_PATHS[pluginType],
        exportPath,
      });

      // Copy over backend-specific files (if selected)
      const backendFolderPath = pluginType === PLUGIN_TYPES.app ? TEMPLATE_PATHS.backendApp : TEMPLATE_PATHS.backend;
      const backendActions = hasBackend
        ? getActionsForTemplateFolder({ folderPath: backendFolderPath, exportPath })
        : [];

      // Common, pluginType and backend actions can contain different templates for the same destination.
      // This filtering removes the duplicate file additions to prevent plop erroring and makes sure the
      // correct template is scaffolded.
      // Note that the order is reversed so backend > pluginType > common
      const pluginActions = [...backendActions, ...pluginTypeSpecificActions, ...commonActions].reduce((acc, file) => {
        const actionExists = acc.find((f) => f.path === file.path);
        // return early to prevent multiple add type actions being added to the array
        if (actionExists && actionExists.type === 'add' && file.type === 'add') {
          return acc;
        }
        acc.push(file);
        return acc;
      }, []);

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
        ...pluginActions,
        ...ciWorkflowActions,
        ...readmeActions,
        ...isCompatibleWorkflowActions,
        {
          type: 'updateGoSdkAndModules',
        },
        {
          type: 'printSuccessMessage',
        },
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
    replacePatternWithTemplateInReadme(
      '-- INSERT DISTRIBUTING YOUR PLUGIN --',
      'distributing-your-plugin.md',
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
function getActionsForTemplateFolder({
  folderPath,
  exportPath,
  templateData = {},
}: {
  folderPath: string;
  exportPath: string;
  templateData?: Record<string, string>;
}) {
  const files = glob.sync(`${folderPath}/**`, { dot: true });
  function getExportFileName(f: string) {
    // yarn and npm packing will not include `.gitignore` files
    // so we have to manually rename them to add the dot prefix
    if (path.basename(f) === 'gitignore') {
      return '.gitignore';
    }
    return path.extname(f) === '.hbs' ? path.basename(f, '.hbs') : path.basename(f);
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
    return fs.lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}

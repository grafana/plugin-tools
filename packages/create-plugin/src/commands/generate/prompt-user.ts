import minimist from 'minimist';
import Enquirer from 'enquirer';
import { PLUGIN_TYPES } from '../../constants.js';
import { GenerateCliArgs } from '../../types.js';

export async function promptUser(argv: minimist.ParsedArgs) {
  let answers: Partial<GenerateCliArgs> = {};
  const enquirer = new Enquirer();

  for (const prompt of prompts) {
    const { name, shouldPrompt } = prompt(answers);

    if (argv.hasOwnProperty(name)) {
      answers = { ...answers, [name]: argv[name] };
    } else {
      if (typeof shouldPrompt === 'function' && !shouldPrompt(answers)) {
        continue;
      } else {
        const result = await enquirer.prompt(prompt(answers));
        answers = { ...answers, ...result };
      }
    }
  }

  return answers as GenerateCliArgs;
}

type Prompt = {
  name: keyof GenerateCliArgs;
  type: string | (() => string);
  message: string | (() => string) | (() => Promise<string>);
  validate?: (value: string) => boolean | string | Promise<boolean | string>;
  initial?: any;
  choices?: Array<string | Choice>;
  shouldPrompt?: (answers: Partial<GenerateCliArgs>) => boolean;
};

type Choice = {
  name: string;
  message?: string;
  value?: unknown;
  hint?: string;
  role?: string;
  enabled?: boolean;
  disabled?: boolean | string;
};

const prompts: Array<(answers: Partial<GenerateCliArgs>) => Prompt> = [
  () => ({
    name: 'pluginType',
    type: 'select',
    choices: [
      {
        name: 'App (Custom pages, UI Extensions and bundling other plugins)',
        value: PLUGIN_TYPES.app,
      },
      {
        name: 'Data source (Query data from a custom source)',
        value: PLUGIN_TYPES.datasource,
      },
      {
        name: 'Panel (New visualization for data or a widget)',
        value: PLUGIN_TYPES.panel,
      },
      {
        name: 'App with Scenes (Create dynamic dashboards in app pages)',
        value: PLUGIN_TYPES.scenes,
      },
    ],
    message: 'Select plugin type',
  }),
  (answers) => ({
    name: 'hasBackend',
    type: 'confirm',
    message:
      answers.pluginType === PLUGIN_TYPES.app
        ? 'Does your plugin require a backend to support server-side functionality (e.g. calling external APIs, custom backend logic, advanced authentication, etc)?'
        : 'Does your plugin require a backend to support server-side functionality (e.g. alerting, advanced authentication, public dashboards, etc)?',
    initial: false,
    shouldPrompt: (answers) => answers.pluginType !== PLUGIN_TYPES.panel,
  }),
  () => ({
    name: 'pluginName',
    type: 'input',
    message: 'Enter a name for your plugin',
    validate: (value: string) => {
      if (/.+/.test(value)) {
        return true;
      }
      return 'Plugin name is required';
    },
  }),
  () => ({
    name: 'orgName',
    type: 'input',
    message: 'Enter your organization name (usually your Grafana Cloud org)',
    validate: (value: string) => {
      if (/.+/.test(value)) {
        return true;
      }
      return 'Organization name is required';
    },
  }),
  () => ({
    name: 'pluginDescription',
    type: 'input',
    message: 'How would you describe your plugin?',
    initial: '',
  }),
];

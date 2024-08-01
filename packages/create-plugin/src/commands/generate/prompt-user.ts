import minimist from 'minimist';
import Enquirer from 'enquirer';
import { PLUGIN_TYPES } from '../../constants.js';
import { GenerateCliArgs } from '../../types.js';

export async function promptUser(argv: minimist.ParsedArgs) {
  let answers: Partial<GenerateCliArgs> = {};
  const enquirer = new Enquirer();

  for (const p of prompts) {
    const prompt = p(answers);

    if (argv.hasOwnProperty(prompt.name)) {
      answers = { ...answers, [prompt.name]: argv[prompt.name] };
    } else {
      if (typeof prompt.shouldPrompt === 'function' && !prompt.shouldPrompt(answers)) {
        continue;
      } else {
        const result = await enquirer.prompt(prompt);
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
  name?: string;
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
        message: 'App (add custom pages, UI extensions and bundle other plugins)',
        value: PLUGIN_TYPES.app,
      },
      {
        message: 'Data source (query data from a custom source)',
        value: PLUGIN_TYPES.datasource,
      },
      {
        message: 'Panel (add a visualization for data or a widget)',
        value: PLUGIN_TYPES.panel,
      },
      {
        message: 'App with Scenes (create dynamic dashboards in app pages)',
        value: PLUGIN_TYPES.scenes,
      },
    ],
    message: 'Select a plugin type',
  }),
  (answers) => {
    const isAppType = answers.pluginType === PLUGIN_TYPES.app || answers.pluginType === PLUGIN_TYPES.scenes;
    const message = isAppType
      ? 'Add a backend to support server-side functionality? (calling external APIs, custom backend logic, advanced authentication, etc)'
      : 'Add a backend to support server-side functionality? (alerting, advanced authentication, public dashboards, etc)';

    return {
      name: 'hasBackend',
      type: 'confirm',
      message: message,
      initial: false,
      shouldPrompt: (answers) => answers.pluginType !== PLUGIN_TYPES.panel,
    };
  },
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
];

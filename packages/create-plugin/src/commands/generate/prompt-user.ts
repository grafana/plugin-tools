import minimist from 'minimist';
import Enquirer from 'enquirer';
import { PLUGIN_TYPES } from '../../constants.js';
import { GenerateCliArgs } from '../../types.js';

export async function promptUser<T>(argv: minimist.ParsedArgs, prompts: Array<Prompt<T>>): Promise<T> {
  let answers: Partial<T> = {};
  const enquirer = new Enquirer();

  for (const prompt of prompts) {
    const { name, shouldPrompt } = prompt;

    if (argv.hasOwnProperty(name as string)) {
      answers = { ...answers, [name]: argv[name as string] };
    } else {
      if (typeof shouldPrompt === 'function' && !shouldPrompt(answers)) {
        continue;
      } else {
        //@ts-ignore TODO: fix this later
        const result = await enquirer.prompt(prompt);
        answers = { ...answers, ...result };
      }
    }
  }

  return answers as T;
}

export type Prompt<T> = {
  name: keyof T;
  type: string | (() => string);
  message: string | (() => string) | (() => Promise<string>);
  validate?: (value: string) => boolean | string | Promise<boolean | string>;
  initial?: any;
  choices?: Array<string | Choice>;
  shouldPrompt?: (answers: Partial<T>) => boolean;
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

export const generateCliPrompts: Array<Prompt<GenerateCliArgs>> = [
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
  {
    name: 'hasBackend',
    type: 'confirm',
    message: 'Do you want a backend part of your plugin?',
    initial: false,
    shouldPrompt: (answers) => answers.pluginType !== PLUGIN_TYPES.panel,
  },
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

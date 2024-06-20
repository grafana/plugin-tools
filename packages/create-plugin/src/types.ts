import { PLUGIN_TYPES } from './constants.js';

export type BaseCliArgs = {
  pluginName: string;
  orgName: string;
};

// The arguments that are passed to the CLI when generating a new plugin.
// (Either via user prompts or CLI arguments)
export type GenerateCliArgs = BaseCliArgs & {
  pluginDescription: string;
  pluginType: PLUGIN_TYPES;
  hasBackend: boolean;
  hasGithubWorkflows: boolean;
  hasGithubLevitateWorkflow: boolean;
};

export type FromTemplateCliArgs = BaseCliArgs & {
  template: string;
};

export type TemplateData = {
  pluginId: string;
  pluginName: string;
  pluginDescription: string;
  hasBackend: boolean;
  orgName: string;
  pluginType: PLUGIN_TYPES;
  packageManagerName: string;
  packageManagerInstallCmd: string;
  packageManagerVersion: string;
  isAppType: boolean;
  isNPM: boolean;
  version: string;
  bundleGrafanaUI: boolean;
  useReactRouterV6: boolean;
  reactRouterVersion: string;
  usePlaywright: boolean;
  useCypress: boolean;
  hasGithubWorkflows: boolean;
  hasGithubLevitateWorkflow: boolean;
  pluginExecutable?: string;
};

export interface ExampleMetaData {
  name: string;
  path: string;
  url: string;
  description: number;
}

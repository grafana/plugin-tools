import { PLUGIN_TYPES } from './constants.js';

// The arguments that are passed to the CLI when generating a new plugin.
// (Either via user prompts or CLI arguments)
export type GenerateCliArgs = {
  pluginName: string;
  orgName: string;
  pluginType: PLUGIN_TYPES;
  hasBackend: boolean;
};

export type TemplateData = {
  pluginId: string;
  pluginName: string;
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
  useExperimentalRspack: boolean;
  pluginExecutable?: string;
};

import { PLUGIN_TYPES } from '../constants';

export type CliArgs = {
  pluginName: string;
  pluginDescription: string;
  orgName: string;
  pluginType: PLUGIN_TYPES;
  hasBackend: boolean;
  hasGithubWorkflows: boolean;
  hasGithubLevitateWorkflow: boolean;
};

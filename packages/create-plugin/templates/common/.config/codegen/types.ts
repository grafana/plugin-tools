import { PluginSchema } from '../types/pluginSchema';

export interface CodeGenerator {
  name: string;
  fileName: string;
  canGenerate: (pluginJson: PluginSchema) => boolean;
  generate: (pluginJson: PluginSchema) => string;
}

export type FileWriter = (file: string, content: string) => void;
export type FileReader = (file: string) => string;
export type Prettifier = (file: string) => void;

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FileWriter, FileReader, Prettifier } from './types';
import { CodeGenerator } from './types';
import { getPluginJsonPath } from '../utils';
import { getCodegenDirPath, logError, logInfo, logWarning, prettifyFile } from './utils';
import { CODEGEN_DIR, SOURCE_DIR } from '../constants';
import { PluginSchema } from '../../types/pluginSchema';
import { pluginIncludes } from './generators/pluginIncludes';

const codeGenerators: CodeGenerator[] = [pluginIncludes];

const fileWriter: FileWriter = (file, content) => {
  const outputFile = path.join(process.cwd(), SOURCE_DIR, CODEGEN_DIR, file);
  writeFileSync(outputFile, content);
};

const fileReader: FileReader = (file) => {
  return readFileSync(file, 'utf-8');
};

const prettifier: Prettifier = prettifyFile;

export function generateCode() {
  const pluginJsonPath = getPluginJsonPath();
  const pluginJson: PluginSchema = JSON.parse(fileReader(pluginJsonPath));
  const generators = codeGenerators.filter((generator) => generator.canGenerate(pluginJson));
  if (!generators.length) {
    logWarning('No code generators found for plugin.json');
    return;
  }

  // Create codegen directory if it doesn't exist
  if (!existsSync(getCodegenDirPath())) {
    mkdirSync(getCodegenDirPath());
  }

  generators.forEach((generator) => {
    try {
      logInfo(`Generating code for`, generator.name);
      const code = generator.generate(pluginJson);
      fileWriter(generator.fileName, code);
      prettifier(generator.fileName);
      logInfo(`Code generated and prettified for`, generator.name);
    } catch (error) {
      logError(`Error generating code for ${generator.name}: ${error}`);
    }
  });
}

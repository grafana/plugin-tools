import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FileWriter, FileReader, Prettifier } from './types';
import { CodeGenerator } from './types';
import { getPluginJsonPath } from '../{{frontendBundler}}/utils';
import { getCodegenDirPath, logError, logInfo, logWarning, prettifyFile } from './utils';
import { CODEGEN_DIR, SOURCE_DIR } from '../{{frontendBundler}}/constants';
import { PluginSchema } from '../types/pluginSchema';
import { includes } from './generators/includes';
import { addedLinks } from './generators/addedLinks';
import { addedComponents } from './generators/addedComponents';
import { addedFunctions } from './generators/addedFunctions';

const codeGenerators: CodeGenerator[] = [includes, addedLinks, addedComponents, addedFunctions];

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
      console.log('');
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

import { CodeGenerator } from '../types';
import { PluginSchema } from '../../../types/pluginSchema';
import { FILE_HEADER_COMMENT, getVariableName } from '../utils';

const usedNames = new Set<string>();

function canGenerate(json: PluginSchema) {
  return Boolean(json?.extensions?.addedFunctions?.length);
}

function generate(json: PluginSchema) {
  if (!json?.extensions?.addedFunctions?.length || !canGenerate(json)) {
    return '';
  }

  usedNames.clear();
  const addedLinksConstants = json.extensions.addedFunctions
    .map((fn) => {
      const variableName = getVariableName(fn.title, usedNames);
      return `export const ${variableName} = ${JSON.stringify(fn)};`;
    })
    .join('\n\n');

  return `${FILE_HEADER_COMMENT}

${addedLinksConstants}
`;
}

export const addedFunctions: CodeGenerator = {
  name: 'addedFunctions',
  fileName: 'addedFunctions.ts',
  canGenerate,
  generate,
};

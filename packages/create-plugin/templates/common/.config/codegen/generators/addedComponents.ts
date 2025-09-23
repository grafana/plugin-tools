import { CodeGenerator } from '../types';
import { PluginSchema } from '../../types/pluginSchema';
import { FILE_HEADER_COMMENT, getVariableName } from '../utils';

const usedNames = new Set<string>();

function canGenerate(json: PluginSchema) {
  return Boolean(json?.extensions?.addedComponents?.length);
}

function generate(json: PluginSchema) {
  if (!json?.extensions?.addedComponents?.length || !canGenerate(json)) {
    return '';
  }

  usedNames.clear();
  const addedLinksConstants = json.extensions.addedComponents
    .map((component) => {
      const variableName = getVariableName(component.title, usedNames);
      return `export const ${variableName} = ${JSON.stringify(component)};`;
    })
    .join('\n\n');

  return `${FILE_HEADER_COMMENT}

${addedLinksConstants}
`;
}

export const addedComponents: CodeGenerator = {
  name: 'addedComponents',
  fileName: 'addedComponents.ts',
  canGenerate,
  generate,
};

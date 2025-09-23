import { CodeGenerator } from '../types';
import { PluginSchema } from '../../types/pluginSchema';
import { FILE_HEADER_COMMENT, getVariableName } from '../utils';

const usedNames = new Set<string>();

function canGenerate(json: PluginSchema) {
  return Boolean(json?.extensions?.addedLinks?.length);
}


function generate(json: PluginSchema) {
  if (!json?.extensions?.addedLinks?.length || !canGenerate(json)) {
    return '';
  }

  usedNames.clear();
  const addedLinksConstants = json.extensions.addedLinks
    .map((link) => {
      const variableName = getVariableName(link.title, usedNames);
      return `export const ${variableName} = ${JSON.stringify(link)};`;
    })
    .join('\n\n');

  return `${FILE_HEADER_COMMENT}

${addedLinksConstants}
`;
}

export const addedLinks: CodeGenerator = {
  name: 'addedLinks',
  fileName: 'addedLinks.ts',
  canGenerate,
  generate,
};

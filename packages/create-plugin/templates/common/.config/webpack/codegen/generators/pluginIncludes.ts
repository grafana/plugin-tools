import { CodeGenerator } from '../types';
import { PluginSchema } from '../../../types/pluginSchema';
import { FILE_HEADER_COMMENT } from '../utils';
import { CONFIG_DIR } from '../../constants';

function canGenerate(pluginJson: PluginSchema) {
  return Boolean(pluginJson?.includes?.length);
}

function generate(pluginJson: PluginSchema) {
  if (!pluginJson?.includes?.length) {
    return '';
  }

  // Create dynamic import statement
  const imports = 'Include';

  // Generate includes enum if includes exist
  const includesEnum = `export enum PluginIncludePaths {
    ${pluginJson.includes
      .map((inc) => `${inc.name?.replace(/\s+/g, '')} = "${inc.path?.replace(/%PLUGIN_ID%/, pluginJson.id)}"`)
      .join(',\n')}
  }`;

  // Generate includes map if includes exist
  const includesMap = `export const PluginIncludes: ReadonlyMap<PluginIncludePaths, Include> = new Map([
    ${pluginJson.includes
      .map((inc) => {
        const enumKey = inc.name?.replace(/\s+/g, '');
        // Create the include object without JSON.stringify to preserve the enum reference
        const include = {
          ...inc,
          path: `PluginIncludePaths.${enumKey}`,
        };
        // Convert to string but replace the quoted enum reference with the actual reference
        const includeStr = JSON.stringify(include).replace(
          `"PluginIncludePaths.${enumKey}"`,
          `PluginIncludePaths.${enumKey}`
        );
        return `[PluginIncludePaths.${enumKey}, ${includeStr}]`;
      })
      .join(',\n')}
  ]);`;

  const fileContent = `${FILE_HEADER_COMMENT}
import { ${imports} } from '../../${CONFIG_DIR}/types/pluginSchema';

${includesEnum}

${includesMap}
`;

  return fileContent;
}

export const pluginIncludes: CodeGenerator = {
  name: 'pluginIncludes',
  fileName: 'pluginIncludes.ts',
  canGenerate,
  generate,
};

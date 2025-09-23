import { CodeGenerator } from '../types';
import { Include, PluginSchema } from '../../types/pluginSchema';
import { FILE_HEADER_COMMENT } from '../utils';
import { CONFIG_DIR } from '../../{{frontendBundler}}/constants';

const ID_MACRO = '%PLUGIN_ID%';

function canGenerate(json: PluginSchema) {
  return Boolean(json?.includes?.length);
}

function removeStartingSlash(str: string): string {
  return str.replace(/^\/+/, '');
}

function getRelativePath(include: Include): string {
  const splits = include.path?.split(ID_MACRO) || [];
  if (splits.length > 1) {
    return removeStartingSlash(splits[1].trim());
  }

  if (splits.length) {
    return removeStartingSlash(splits[0].trim());
  }

  return '';
}

function generate(json: PluginSchema) {
  if (!json?.includes?.length || !canGenerate(json)) {
    return '';
  }

  // Create dynamic import statement
  const imports = 'Include';

  // Generate includes enum if includes exist
  const includesEnum = `export enum PluginIncludePaths {
    ${json.includes
      .map((inc) => `${inc.name?.replace(/\s+/g, '')} = "${inc.path?.replace(/%PLUGIN_ID%/, json.id)}"`)
      .join(',\n')}
  }`;

  // Generate relative includes enum if includes exist
  const relativeIncludesEnum = `export enum PluginIncludeRelativePaths {
    ${json.includes.map((inc) => `${inc.name?.replace(/\s+/g, '')} = "${getRelativePath(inc)}"`).join(',\n')}
  }`;

  // Generate includes map if includes exist
  const includesMap = `export const PluginIncludes: ReadonlyMap<PluginIncludePaths, Include> = new Map([
    ${json.includes
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

${relativeIncludesEnum}

${includesMap}
`;

  return fileContent;
}

export const includes: CodeGenerator = {
  name: 'includes',
  fileName: 'includes.ts',
  canGenerate,
  generate,
};

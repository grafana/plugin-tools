import * as recast from 'recast';
import * as babelParser from 'recast/parsers/babel-ts.js';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';

const { builders } = recast.types;

export function addI18nInitialization(context: Context, needsBackwardCompatibility: boolean): void {
  // Find module.ts or module.tsx
  const moduleTsPath = context.doesFileExist('src/module.ts')
    ? 'src/module.ts'
    : context.doesFileExist('src/module.tsx')
      ? 'src/module.tsx'
      : null;

  if (!moduleTsPath) {
    additionsDebug('No module.ts or module.tsx found, skipping i18n initialization');
    return;
  }

  const moduleContent = context.getFile(moduleTsPath);
  if (!moduleContent) {
    return;
  }

  // Defensive: check if i18n is already initialized
  if (moduleContent.includes('initPluginTranslations')) {
    additionsDebug('i18n already initialized in module file');
    return;
  }

  try {
    const ast = recast.parse(moduleContent, {
      parser: babelParser,
    });

    const imports = [];

    // Add necessary imports based on backward compatibility
    imports.push(
      builders.importDeclaration(
        [builders.importSpecifier(builders.identifier('initPluginTranslations'))],
        builders.literal('@grafana/i18n')
      )
    );

    imports.push(
      builders.importDeclaration(
        [builders.importDefaultSpecifier(builders.identifier('pluginJson'))],
        builders.literal('plugin.json')
      )
    );

    if (needsBackwardCompatibility) {
      imports.push(
        builders.importDeclaration(
          [builders.importSpecifier(builders.identifier('config'))],
          builders.literal('@grafana/runtime')
        )
      );
      imports.push(
        builders.importDeclaration(
          [builders.importDefaultSpecifier(builders.identifier('semver'))],
          builders.literal('semver')
        )
      );
      imports.push(
        builders.importDeclaration(
          [builders.importSpecifier(builders.identifier('loadResources'))],
          builders.literal('./loadResources')
        )
      );
    }

    // Find the last import index (use consistent approach for both imports and initialization)
    const lastImportIndex = ast.program.body.findLastIndex((node: any) => node.type === 'ImportDeclaration');

    // Add imports after the last import statement
    if (lastImportIndex !== -1) {
      ast.program.body.splice(lastImportIndex + 1, 0, ...imports);
    } else {
      ast.program.body.unshift(...imports);
    }

    // Add i18n initialization code
    const i18nInitCode = needsBackwardCompatibility
      ? `// Before Grafana version 12.1.0 the plugin is responsible for loading translation resources
// In Grafana version 12.1.0 and later Grafana is responsible for loading translation resources
const loaders = semver.lt(config?.buildInfo?.version || '0.0.0', '12.1.0') ? [loadResources] : [];

await initPluginTranslations(pluginJson.id, loaders);`
      : `await initPluginTranslations(pluginJson.id);`;

    // Parse the initialization code and insert it at the top level (after imports)
    const initAst = recast.parse(i18nInitCode, {
      parser: babelParser,
    });

    // Find the last import index again (after adding new imports)
    const finalLastImportIndex = ast.program.body.findLastIndex((node: any) => node.type === 'ImportDeclaration');
    if (finalLastImportIndex !== -1) {
      ast.program.body.splice(finalLastImportIndex + 1, 0, ...initAst.program.body);
    } else {
      ast.program.body.unshift(...initAst.program.body);
    }

    const output = recast.print(ast, {
      tabWidth: 2,
      trailingComma: true,
      lineTerminator: '\n',
    }).code;

    context.updateFile(moduleTsPath, output);
    additionsDebug(`Updated ${moduleTsPath} with i18n initialization`);
  } catch (error) {
    additionsDebug('Error updating module file:', error);
  }
}

export function createLoadResourcesFile(context: Context): void {
  const loadResourcesPath = 'src/loadResources.ts';

  // Defensive: skip if already exists
  if (context.doesFileExist(loadResourcesPath)) {
    additionsDebug('loadResources.ts already exists, skipping');
    return;
  }

  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    additionsDebug('Cannot create loadResources.ts without plugin.json');
    return;
  }

  const loadResourcesContent = `import { LANGUAGES, ResourceLoader, Resources } from '@grafana/i18n';
import pluginJson from 'plugin.json';

const resources = LANGUAGES.reduce<Record<string, () => Promise<{ default: Resources }>>>((acc, lang) => {
  acc[lang.code] = () => import(\`./locales/\${lang.code}/\${pluginJson.id}.json\`);
  return acc;
}, {});

export const loadResources: ResourceLoader = async (resolvedLanguage: string) => {
  try {
    const translation = await resources[resolvedLanguage]();
    return translation.default;
  } catch (error) {
    // This makes sure that the plugin doesn't crash when the resolved language in Grafana isn't supported by the plugin
    console.error(\`The plugin '\${pluginJson.id}' doesn't support the language '\${resolvedLanguage}'\`, error);
    return {};
  }
};
`;

  context.addFile(loadResourcesPath, loadResourcesContent);
  additionsDebug('Created src/loadResources.ts for backward compatibility');
}

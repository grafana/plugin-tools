import { minSatisfying, gtr, ltr, coerce, minVersion, gte, lt } from 'semver';
import type { Context } from '../../context.js';
import {
  createImport,
  findObjectProperty,
  findVariableDeclaration,
  insertImports,
  parseAsTypescript,
  printAST,
} from '../../utils.ast.js';
import { renderTemplate } from '../../utils.js';

export default function externalizeJSXRuntime(context: Context): Context {
  const hasExternalsFile = context.doesFileExist('.config/bundler/externals.ts');

  if (!hasExternalsFile) {
    const rendered = renderExternalsTemplate();

    context.addFile('.config/bundler/externals.ts', rendered);

    const bundlerConfigFilePath = context.doesFileExist('.config/webpack/webpack.config.ts')
      ? '.config/webpack/webpack.config.ts'
      : '.config/rspack/rspack.config.ts';

    const bundlerConfigFile = context.getFile(bundlerConfigFilePath);

    if (bundlerConfigFile) {
      const bundlerConfigAST = parseAsTypescript(context.getFile(bundlerConfigFilePath) || '');
      const importDec = createImport({ named: [{ name: 'externals' }] }, '../bundler/externals.ts');
      if (!bundlerConfigAST.ast) {
        throw new Error(`Failed to parse ${bundlerConfigFilePath}`);
      }
      insertImports(bundlerConfigAST.ast, [importDec]);
      const baseConfig = findVariableDeclaration(bundlerConfigAST.ast, 'baseConfig');
      if (!baseConfig) {
        throw new Error(`Could not find baseConfig variable declaration in ${bundlerConfigFilePath}`);
      }

      if (baseConfig.init?.type !== 'ObjectExpression') {
        throw new Error(`baseConfig variable in ${bundlerConfigFilePath} is not an object.`);
      }

      const externalsProperty = findObjectProperty(baseConfig.init, 'externals');
      if (externalsProperty?.type === 'ObjectProperty' && externalsProperty.value.type === 'ArrayExpression') {
        externalsProperty.value = {
          type: 'Identifier',
          name: 'externals',
        };
        externalsProperty.shorthand = true;
      }

      context.updateFile(bundlerConfigFilePath, printAST(bundlerConfigAST.ast));
    }
  } else {
    const rendered = renderExternalsTemplate();
    context.updateFile('.config/bundler/externals.ts', rendered);
  }

  const pluginJsonContent = context.getFile('src/plugin.json');
  if (pluginJsonContent) {
    const pluginJson = JSON.parse(pluginJsonContent);
    if (pluginJson.dependencies?.grafanaDependency !== undefined) {
      const pluginMinSupportedVersion = minVersion(pluginJson.dependencies.grafanaDependency);
      if (pluginMinSupportedVersion && lt(pluginMinSupportedVersion, '12.3.0')) {
        pluginJson.dependencies.grafanaDependency =
          '>=11.6.11 <12 || >=12.0.10 <12.1 || >=12.1.7 <12.2 || >=12.2.5 <12.3 || >=12.3.0';
        context.updateFile('src/plugin.json', JSON.stringify(pluginJson, null, 2));
      }
    }
  }

  return context;
}

function renderExternalsTemplate() {
  const externalsPath = new URL('../../../../templates/common/.config/bundler/externals.ts', import.meta.url).pathname;
  const rendered = renderTemplate(externalsPath, true);
  return rendered;
}

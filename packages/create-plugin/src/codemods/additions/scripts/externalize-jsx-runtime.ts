import { minVersion, lt, gte } from 'semver';
import type { Context } from '../../context.js';
import {
  createImport,
  findObjectProperty,
  findVariableDeclaration,
  insertImports,
  parseAsTypescript,
  printAST,
} from '../../utils.ast.js';
import { additionsDebug, renderTemplate } from '../../utils.js';

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
      const parsedBundlerConfig = parseAsTypescript(bundlerConfigFile);

      if (!parsedBundlerConfig.success) {
        additionsDebug(`Failed to parse ${bundlerConfigFilePath}. Error: ${parsedBundlerConfig.error.message}`);
        return context;
      }

      const baseConfig = findVariableDeclaration(parsedBundlerConfig.ast, 'baseConfig');
      if (!baseConfig) {
        additionsDebug(`Could not find baseConfig variable declaration in ${bundlerConfigFilePath}`);
        return context;
      }

      if (baseConfig.init?.type !== 'ObjectExpression') {
        additionsDebug(`baseConfig variable in ${bundlerConfigFilePath} is not an object.`);
        return context;
      }

      const externalsProperty = findObjectProperty(baseConfig.init, 'externals');
      if (externalsProperty?.type === 'ObjectProperty' && externalsProperty.value.type === 'ArrayExpression') {
        const importDec = createImport({ named: [{ name: 'externals' }] }, '../bundler/externals.ts');
        insertImports(parsedBundlerConfig.ast, [importDec]);
        externalsProperty.value = {
          type: 'Identifier',
          name: 'externals',
        };
        externalsProperty.shorthand = true;
        context.updateFile(bundlerConfigFilePath, printAST(parsedBundlerConfig.ast));
      }
    } else {
      additionsDebug('Could not find a bundler config in `./config` to update with externals import.');
    }
  } else {
    const rendered = renderExternalsTemplate();
    context.updateFile('.config/bundler/externals.ts', rendered);
  }

  const semverRanges = ['>=11.6.11 <12', '>=12.0.10 <12.1', '>=12.1.7 <12.2', '>=12.2.5 <12.3', '>=12.3.0'];
  const externalsHasJsxRuntime = context.getFile('.config/bundler/externals.ts')?.includes('react/jsx-runtime');
  const pluginJsonContent = context.getFile('src/plugin.json');
  if (pluginJsonContent && externalsHasJsxRuntime) {
    let pluginJson;
    try {
      pluginJson = JSON.parse(pluginJsonContent);
    } catch (error) {
      additionsDebug(`Failed to parse src/plugin.json: ${error}`);
      return context;
    }

    if (pluginJson.dependencies?.grafanaDependency === undefined) {
      pluginJson.dependencies = {
        ...pluginJson.dependencies,
        grafanaDependency: '>=12.3.0',
      };
      context.updateFile('src/plugin.json', JSON.stringify(pluginJson, null, 2));
    }

    const pluginMinSupportedVersion = minVersion(pluginJson.dependencies.grafanaDependency);

    if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.3.0')) {
      return context;
    }

    if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.2.0')) {
      pluginJson.dependencies.grafanaDependency = semverRanges.slice(3).join(' || ');
    } else if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.1.0')) {
      pluginJson.dependencies.grafanaDependency = semverRanges.slice(2).join(' || ');
    } else if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.0.0')) {
      pluginJson.dependencies.grafanaDependency = semverRanges.slice(1).join(' || ');
    } else if (pluginMinSupportedVersion && lt(pluginMinSupportedVersion, '12.0.0')) {
      pluginJson.dependencies.grafanaDependency = semverRanges.join(' || ');
    }

    context.updateFile('src/plugin.json', JSON.stringify(pluginJson, null, 2));
  }

  return context;
}

function renderExternalsTemplate() {
  const externalsPath = new URL('../../../../templates/common/.config/bundler/externals.ts', import.meta.url).pathname;
  const rendered = renderTemplate(externalsPath, true);
  return rendered;
}

import { minVersion, lt, gte, coerce } from 'semver';
import type { Context } from '../../context.js';
import {
  createImport,
  findObjectProperty,
  findVariableDeclaration,
  insertImports,
  isProperty,
  parseAsTypescript,
  printAST,
} from '../../utils.ast.js';
import { additionsDebug, renderTemplate } from '../../utils.js';
import { forEachPlugin } from '../../utils.project.js';
import { fileURLToPath } from 'node:url';

export default function externalizeJSXRuntime(context: Context): Context {
  const hasExternalsFile = context.doesFileExist('.config/bundler/externals.ts');

  if (!hasExternalsFile) {
    const rendered = renderExternalsTemplate(context.basePath);

    context.addFile('.config/bundler/externals.ts', rendered);

    const webpackConfigExists = context.doesFileExist('.config/webpack/webpack.config.ts');
    const rspackConfigExists = context.doesFileExist('.config/rspack/rspack.config.ts');

    if (!webpackConfigExists && !rspackConfigExists) {
      additionsDebug('No bundler config found in `./config`. Skipping updating bundler config with externals import.');
      return context;
    }
    const bundlerConfigFilePath = webpackConfigExists
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
      if (externalsProperty && isProperty(externalsProperty) && externalsProperty.value.type === 'ArrayExpression') {
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
    const rendered = renderExternalsTemplate(context.basePath);
    context.updateFile('.config/bundler/externals.ts', rendered);
  }

  const externalsHasJsxRuntime = context.getFile('.config/bundler/externals.ts')?.includes('react/jsx-runtime');

  forEachPlugin(context, (_plugin, resolvePath) => {
    updateGrafanaDependency(context, resolvePath('src/plugin.json'), Boolean(externalsHasJsxRuntime));
  });

  return context;
}

const SEMVER_RANGES = ['>=11.6.11 <12', '>=12.0.10 <12.1', '>=12.1.7 <12.2', '>=12.2.5'];

// Widens a plugin's grafanaDependency to the Grafana versions that provide the react/jsx-runtime external.
function updateGrafanaDependency(context: Context, pluginJsonPath: string, externalsHasJsxRuntime: boolean) {
  const pluginJsonContent = context.getFile(pluginJsonPath);
  if (!pluginJsonContent || !externalsHasJsxRuntime) {
    additionsDebug(
      `Skipping updating ${pluginJsonPath} with new grafanaDependency range due to missing plugin.json or externals.ts does not include react/jsx-runtime.`
    );
    return;
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(pluginJsonContent);
  } catch (error) {
    additionsDebug(`Failed to parse ${pluginJsonPath}: ${error}`);
    return;
  }

  if (pluginJson.dependencies?.grafanaDependency === undefined) {
    pluginJson.dependencies = {
      ...pluginJson.dependencies,
      grafanaDependency: '>=12.2.5',
    };
    context.updateFile(pluginJsonPath, JSON.stringify(pluginJson, null, 2));
  }

  let pluginMinSupportedVersion = minVersion(pluginJson.dependencies.grafanaDependency);

  if (pluginMinSupportedVersion && pluginMinSupportedVersion.prerelease.length) {
    pluginMinSupportedVersion = coerce(
      `${pluginMinSupportedVersion.major}.${pluginMinSupportedVersion.minor}.${pluginMinSupportedVersion.patch}`
    );
  }

  if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.2.5')) {
    return;
  }

  if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.2.0')) {
    pluginJson.dependencies.grafanaDependency = SEMVER_RANGES.slice(3).join(' || ');
  } else if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.1.0')) {
    pluginJson.dependencies.grafanaDependency = SEMVER_RANGES.slice(2).join(' || ');
  } else if (pluginMinSupportedVersion && gte(pluginMinSupportedVersion, '12.0.0')) {
    pluginJson.dependencies.grafanaDependency = SEMVER_RANGES.slice(1).join(' || ');
  } else if (pluginMinSupportedVersion && lt(pluginMinSupportedVersion, '12.0.0')) {
    pluginJson.dependencies.grafanaDependency = SEMVER_RANGES.join(' || ');
  }

  context.updateFile(pluginJsonPath, JSON.stringify(pluginJson, null, 2));
}

function renderExternalsTemplate(rootPath: string) {
  const externalsPath = fileURLToPath(
    new URL('../../../../templates/common/.config/bundler/externals.ts', import.meta.url)
  );
  const rendered = renderTemplate(externalsPath, true, rootPath);
  return rendered;
}

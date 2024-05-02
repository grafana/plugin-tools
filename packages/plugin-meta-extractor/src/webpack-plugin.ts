import path from 'node:path';
import * as webpack from 'webpack';
import { extractPluginMeta } from './meta-extractor.js';

const PLUGIN_NAME = 'GrafanaPluginMetaExtractor';

export class GrafanaPluginMetaExtractor {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          const pluginEntryPoints = await getPluginEntryPoints(compilation.options.entry);

          pluginEntryPoints.forEach((entry) => generatePluginMetaInfo(entry, compiler, compilation));
        }
      );
    });
  }
}

// Returns the entry points that belong to plugins (must be named either `module.ts` or `module.tsx`)
async function getPluginEntryPoints(entry: webpack.EntryNormalized): Promise<string[]> {
  let entryObject = entry;

  if (typeof entry === 'function') {
    entryObject = await entry();
  }

  return Object.values(entryObject)
    .map((entry) => entry.import)
    .flat()
    .filter((entry) => entry && (entry.endsWith('module.ts') || entry.endsWith('module.tsx')));
}

function generatePluginMetaInfo(entry: string, compiler: webpack.Compiler, compilation: webpack.Compilation) {
  const basePath = compiler.context;
  const pluginModulePath = path.resolve(basePath, entry);
  const pluginMeta = extractPluginMeta(pluginModulePath);
  const pluginJsonAssetName = getPluginJsonAssetName(basePath, pluginModulePath);
  const pluginJsonAsset = compilation.getAsset(pluginJsonAssetName);
  const pluginJsonString = pluginJsonAsset ? pluginJsonAsset.source.source().toString() : '{}';
  const pluginJson = JSON.parse(pluginJsonString);
  const modifiedPluginJson = JSON.stringify(
    {
      ...pluginJson,
      generated: pluginMeta,
    },
    null,
    4
  );

  compilation.updateAsset(pluginJsonAssetName, new webpack.sources.RawSource(modifiedPluginJson));
}

function getPluginJsonAssetName(basePath: string, pluginModulePath: string) {
  return path.relative(basePath, getPluginJsonPath(pluginModulePath)).replace(/^\.\//, '');
}

function getPluginJsonPath(pluginModulePath: string) {
  return path.resolve(path.dirname(pluginModulePath), 'plugin.json');
}

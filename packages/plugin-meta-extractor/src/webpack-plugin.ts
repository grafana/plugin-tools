import path from 'node:path';
import * as webpack from 'webpack';
import { extractPluginMeta } from './meta-extractor.js';

const DEFAULT_GENERATED_FILENAME = 'plugin.generated.json';

export type GrafanaPluginMetaExtractorOptions = {
  // Can be used to override the entry file path
  entryFile: string;

  // Can be used to override the output asset name
  outputAssetName?: string;
};

export class GrafanaPluginMetaExtractor {
  options: GrafanaPluginMetaExtractorOptions;

  constructor(options: GrafanaPluginMetaExtractorOptions) {
    this.options = options;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tapAsync('GrafanaPluginMetaExtractor', (compilation, callback) => {
      const { webpack } = compiler;
      const { RawSource } = webpack.sources;
      const entryFile = this.options.entryFile;
      const entryFilePath = path.resolve(compiler.context, entryFile);
      const pluginMeta = extractPluginMeta(entryFilePath);

      const newAssetName = this.options.outputAssetName || DEFAULT_GENERATED_FILENAME;
      const newAssetContent = JSON.stringify(pluginMeta, null, 2);

      compilation.emitAsset(newAssetName, new RawSource(newAssetContent));

      callback();
    });
  }
}

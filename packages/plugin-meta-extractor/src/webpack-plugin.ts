import path from 'node:path';
import * as webpack from 'webpack';
import { JSONSchema6 } from 'json-schema';
import { validate } from 'schema-utils';
import { extractPluginMeta } from './meta-extractor.js';

const DEFAULT_GENERATED_FILENAME = 'plugin.generated.json';
const PLUGIN_NAME = 'GrafanaPluginMetaExtractor';

export type GrafanaPluginMetaExtractorOptions = {
  // Can be used to override the entry file path
  entryFile: string;

  // Can be used to override the output asset name
  outputAssetName?: string;
};

const schema: JSONSchema6 = {
  type: 'object',
  properties: {
    entryFile: {
      description: 'Can be used to override the entry file path.',
      type: 'string',
    },
    outputAssetName: {
      description: `Can be used to override the output asset name. Default is "${DEFAULT_GENERATED_FILENAME}"`,
      type: 'string',
    },
  },
  additionalProperties: false,
  required: ['entryFile'],
};

export class GrafanaPluginMetaExtractor {
  options: GrafanaPluginMetaExtractorOptions;

  constructor(options: GrafanaPluginMetaExtractorOptions) {
    validate(schema, options, {
      name: PLUGIN_NAME,
      baseDataPath: 'options',
    });

    this.options = options;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
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

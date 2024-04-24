import path from 'node:path';
import * as webpack from 'webpack';
import { JSONSchema6 } from 'json-schema';
import { validate } from 'schema-utils';
import { extractPluginMeta } from './meta-extractor.js';

const PLUGIN_NAME = 'GrafanaPluginMetaExtractor';

export type GrafanaPluginMetaExtractorOptions = {
  // Can be used to override the entry file path
  entryFile: string;
};

const schema: JSONSchema6 = {
  type: 'object',
  properties: {
    entryFile: {
      description: 'Can be used to override the entry file path.',
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
      const pluginJsonFilename = 'plugin.json';
      const pluginJsonAsset = compilation.getAsset(pluginJsonFilename);
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

      compilation.updateAsset(pluginJsonFilename, new RawSource(modifiedPluginJson));

      callback();
    });
  }
}

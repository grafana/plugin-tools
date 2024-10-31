import * as webpack from 'webpack';

const PLUGIN_NAME = 'BuildModeWebpack';

export class BuildModeWebpackPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          const pluginJsonAsset = compilation.getAsset('plugin.json');
          const pluginJsonString = pluginJsonAsset ? pluginJsonAsset?.source.source().toString() : '{}';
          const pluginJsonWithBuildMode = JSON.stringify(
            {
              ...JSON.parse(pluginJsonString),
              buildMode: compilation.options.mode,
            },
            null,
            4
          );
          compilation.updateAsset('plugin.json', new webpack.sources.RawSource(pluginJsonWithBuildMode));
        }
      );
    });
  }
}

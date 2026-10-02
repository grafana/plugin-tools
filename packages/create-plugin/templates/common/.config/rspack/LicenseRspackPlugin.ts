import { Compilation, type Compiler } from '@rspack/core';

const PLUGIN_NAME = 'LicenseRspackPlugin';
const CHUNK_LICENSE_PATTERN = /\.LICENSE\.txt$/;

// SwcJsMinimizerRspackPlugin extracts license comments into one file per chunk. Plugins with many
// chunks, for example those bundling monaco-editor, end up with dozens of identical files in dist.
// This merges them into a single LICENSE.txt, keeping each distinct comment once.
export class LicenseRspackPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          // after the minimizer (PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE) has extracted the comments
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE + 1,
        },
        (assets) => {
          const chunkLicenseFiles = Object.keys(assets)
            .filter((assetName) => CHUNK_LICENSE_PATTERN.test(assetName))
            .sort();

          if (chunkLicenseFiles.length === 0) {
            return;
          }

          const comments = new Set<string>();
          for (const assetName of chunkLicenseFiles) {
            const content = assets[assetName].source().toString();
            content
              .split(/\n{2,}/)
              .map((comment) => comment.trim())
              .filter(Boolean)
              .forEach((comment) => comments.add(comment));
            compilation.deleteAsset(assetName);
          }

          const { RawSource } = compiler.rspack.sources;
          compilation.emitAsset('LICENSE.txt', new RawSource([...comments].join('\n\n') + '\n'));
        }
      );
    });
  }
}

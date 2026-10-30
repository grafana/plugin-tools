import { posix } from 'node:path';
import { Compilation, type Compiler } from '@rspack/core';

const PLUGIN_NAME = 'PluginCssRspackPlugin';
const URL_PATTERN = /url\(\s*(["']?)([^"')]+)\1\s*\)/g;
const CHARSET_PATTERN = /^@charset[^;]+;/;

interface PluginCssRspackPluginOptions {
  pluginId: string;
  publicPath: string;
}

// Prepares the CSS Grafana loads as module.css and the CSS of lazy chunks.
export class PluginCssRspackPlugin {
  options: PluginCssRspackPluginOptions;

  constructor(options: PluginCssRspackPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    const { ConcatSource, RawSource, ReplaceSource } = compiler.rspack.sources;
    const { pluginId, publicPath } = this.options;
    const layer = `plugin-${pluginId}`;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          // before the CSS minimizer (PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE) so it minifies the result
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          // module.js depends on ./module.css, and a 404 fails the whole plugin load
          for (const [entryName, entrypoint] of compilation.entrypoints) {
            const cssFile = `${entryName}.css`;
            const hasCss = entrypoint.getFiles().some((file) => file.split('?')[0] === cssFile);
            if (!hasCss && !assets[cssFile]) {
              compilation.emitAsset(cssFile, new RawSource(''));
            }
          }

          for (const assetName of Object.keys(assets)) {
            const fileName = assetName.split('?')[0];
            if (!fileName.endsWith('.css')) {
              continue;
            }

            const source = assets[assetName];
            const css = source.source().toString();
            const updated = new ReplaceSource(source);

            // SystemJS and the browser resolve url() against the CSS file, not the page
            for (const match of css.matchAll(URL_PATTERN)) {
              const url = match[2];
              if (!url.startsWith(publicPath)) {
                continue;
              }
              const relativeUrl = posix.relative(posix.dirname(fileName), url.slice(publicPath.length));
              const start = match.index + match[0].indexOf(url);
              updated.replace(start, start + url.length - 1, relativeUrl);
            }

            // the layer keeps Grafana's unlayered styles winning at equal specificity. @charset must stay first
            const charset = css.match(CHARSET_PATTERN)?.[0];
            if (charset) {
              updated.replace(0, charset.length - 1, '');
            }
            compilation.updateAsset(assetName, new ConcatSource(charset ?? '', `@layer ${layer}{`, updated, '}'));
          }
        }
      );
    });
  }
}

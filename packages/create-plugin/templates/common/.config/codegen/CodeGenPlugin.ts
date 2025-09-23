import type { Compiler } from 'webpack';
import { watchPluginJson, stopWatchingPluginJson } from './watchPluginJson';

const PLUGIN_NAME = 'CodeGenPlugin';
/**
 * Webpack plugin that watches plugin.json and regenerates TypeScript code
 * during development.
 */
export class CodeGenPlugin {
  private watching = false;

  apply(compiler: Compiler) {
    // Start watching when webpack enters watch mode
    compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
      if (this.watching) {
        return;
      }

      this.watching = true;
      watchPluginJson();
    });

    // Stop watching when webpack exits
    compiler.hooks.shutdown.tap(PLUGIN_NAME, () => {
      this.watching = false;
      stopWatchingPluginJson();
    });

    // Generate code on build
    compiler.hooks.beforeRun.tapAsync(PLUGIN_NAME, async (_, callback) => {
      try {
        watchPluginJson();
        callback();
      } catch (error) {
        callback(error as Error);
      }
    });
  }
}

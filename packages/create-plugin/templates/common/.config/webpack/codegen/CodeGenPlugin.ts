import type { Compiler } from 'webpack';
import { watchPluginJson, stopWatchingPluginJson } from './watchPluginJson';

/**
 * Webpack plugin that watches plugin.json and regenerates TypeScript code
 * during development.
 */
export class CodeGenPlugin {
  private watching = false;

  apply(compiler: Compiler) {
    // Start watching when webpack enters watch mode
    compiler.hooks.watchRun.tap('CodeGenPlugin', () => {
      if (this.watching) {
        return;
      }

      this.watching = true;
      watchPluginJson();
    });

    // Stop watching when webpack exits
    compiler.hooks.shutdown.tap('CodeGenPlugin', () => {
      this.watching = false;
      stopWatchingPluginJson();
    });

    // Generate code on initial build
    compiler.hooks.beforeRun.tapAsync('CodeGenPlugin', async (_, callback) => {
      console.log('=========== compiler.hooks.beforeRun ============');
      try {
        watchPluginJson();
        callback();
      } catch (error) {
        callback(error as Error);
      }
    });

    // Prettify after file changes in watch mode
    compiler.hooks.afterCompile.tapAsync('CodeGenPlugin', async (_, callback) => {
      callback();
    });
  }
}

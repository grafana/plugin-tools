import type { Compiler } from 'webpack';
import { watchPluginJson, stopWatchingPluginJson } from './watchPluginJson';
import { execFile as nodeExecFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { GENERATED_FILE, SOURCE_DIR } from './constants';

const execFile = promisify(nodeExecFile);

/**
 * Webpack plugin that watches plugin.json and regenerates TypeScript code
 * during development.
 */
export class PluginSchemaWebpackPlugin {
  private watching = false;

  private async prettifyGeneratedFile() {
    try {
      const filePath = path.join(process.cwd(), SOURCE_DIR, GENERATED_FILE);
      const command = 'npx';
      const args = ['prettier', '--write', filePath];
      await execFile(command, args);
    } catch (error) {
      console.error('Failed to prettify generated file:', error);
    }
  }

  apply(compiler: Compiler) {
    // Start watching when webpack enters watch mode
    compiler.hooks.watchRun.tap('PluginSchemaWebpackPlugin', () => {
      if (this.watching) {
        return;
      }

      this.watching = true;
      watchPluginJson();
    });

    // Stop watching when webpack exits
    compiler.hooks.shutdown.tap('PluginSchemaWebpackPlugin', () => {
      this.watching = false;
      stopWatchingPluginJson();
    });

    // Generate types and prettify on initial build
    compiler.hooks.beforeRun.tapAsync('PluginSchemaWebpackPlugin', async (_, callback) => {
      try {
        watchPluginJson();
        await this.prettifyGeneratedFile();
        callback();
      } catch (error) {
        callback(error as Error);
      }
    });

    // Prettify after file changes in watch mode
    compiler.hooks.afterCompile.tapAsync('PluginSchemaWebpackPlugin', async (_, callback) => {
      if (this.watching) {
        await this.prettifyGeneratedFile();
      }
      callback();
    });
  }
}

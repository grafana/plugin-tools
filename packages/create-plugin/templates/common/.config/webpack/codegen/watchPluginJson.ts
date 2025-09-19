import { watch, FSWatcher } from 'node:fs';
import { getPluginJsonPath } from '../utils';
import { generateCode } from './main';
import { colors } from './utils';

let watcher: FSWatcher | null = null;
const start = `${colors.green}============================================ <CodeGenPlugin> ============================================${colors.reset}`;
const end = `${colors.green}============================================ </CodeGenPlugin> ============================================${colors.reset}`;
/**
 * Watches the plugin.json file and regenerates TypeScript types when it changes
 */
export function watchPluginJson() {
  const pluginJsonPath = getPluginJsonPath();

  // Clean up existing watcher if any
  stopWatchingPluginJson();

  // Generate initial values
  try {
    console.log(start);
    generateCode();
    console.log('');
    console.log(end);
    console.log('');
  } catch (error) {
    console.error('Failed to generate plugin types:', error);
  }

  // Start watching for changes
  watcher = watch(pluginJsonPath, async (eventType) => {
    if (eventType === 'change') {
      console.log(start);
      generateCode();
      console.log('');
      console.log(end);
      console.log('');
    }
  });

  return watcher;
}

/**
 * Stop watching plugin.json file
 */
export function stopWatchingPluginJson() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

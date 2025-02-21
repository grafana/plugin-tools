import { watch, FSWatcher } from 'node:fs';
import { generateCode } from './generateCode';
import { getPluginJsonPath } from './utils';

let watcher: FSWatcher | null = null;

/**
 * Watches the plugin.json file and regenerates TypeScript types when it changes
 */
export function watchPluginJson() {
  const pluginJsonPath = getPluginJsonPath();

  // Clean up existing watcher if any
  stopWatchingPluginJson();

  // Generate initial values
  try {
    generateCode();
    console.log('Successfully generated plugin types and values');
  } catch (error) {
    console.error('Failed to generate plugin types:', error);
  }

  // Start watching for changes
  watcher = watch(pluginJsonPath, async (eventType) => {
    if (eventType === 'change') {
      try {
        generateCode();
        console.log('Successfully regenerated plugin types and values');
      } catch (error) {
        console.error('Failed to regenerate plugin types:', error);
      }
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

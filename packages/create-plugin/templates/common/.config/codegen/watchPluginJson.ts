import { watch, FSWatcher, WatchEventType } from 'node:fs';
import { getPluginJsonPath } from '../{{frontendBundler}}/utils';
import { generateCode } from './main';

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
    console.log('');
  } catch (error) {
    console.error('Failed to generate plugin types:', error);
  }

  // Start watching for changes
  watcher = watch(pluginJsonPath, async (eventType: WatchEventType) => {
    if (eventType === 'change') {
      console.log('');
      generateCode();
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

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dirSync } from 'tmp';

export const DEFAULT_PLUGIN_JSON = {
  id: 'grafana-test-app',
  type: 'app',
  info: {
    version: '1.0.0',
  },
};

// realpathSync prevents false symlink-escape errors on macOS where the temp dir
// lives under /var/... which resolves to /private/var/...
export function createTempDir(): string {
  return realpathSync(dirSync({ prefix: 'sign-plugin-test-', unsafeCleanup: true }).name);
}

export function writeFiles(dir: string, files: Record<string, string>): void {
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(dir, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }
}

export function createPluginDistDir(files: Record<string, string> = {}, pluginJson: object = DEFAULT_PLUGIN_JSON) {
  const dir = createTempDir();
  writeFiles(dir, {
    'plugin.json': JSON.stringify(pluginJson),
    ...files,
  });
  return dir;
}

import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_PLUGIN_JSON = {
  id: 'grafana-test-app',
  type: 'app',
  info: {
    version: '1.0.0',
  },
};

// realpathSync prevents false symlink-escape errors on macOS where os.tmpdir()
// returns /var/... which resolves to /private/var/...
export function createTempDir(): string {
  return realpathSync(mkdtempSync(path.join(os.tmpdir(), 'sign-plugin-test-')));
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

import crypto from 'node:crypto';
import { readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';
import { buildManifest, ManifestInfo, saveManifest, signManifest } from './manifest.js';
import { createPluginDistDir, createTempDir, DEFAULT_PLUGIN_JSON, writeFiles } from './tests/fixtures.js';

const mocks = vi.hoisted(() => {
  return {
    postData: vi.fn(),
  };
});

vi.mock('./request.js', () => {
  return { postData: mocks.postData };
});

function sha256(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

describe('buildManifest', () => {
  const tempDirs: string[] = [];

  function pluginDistDir(files: Record<string, string> = {}, pluginJson: object = DEFAULT_PLUGIN_JSON) {
    const dir = createPluginDistDir(files, pluginJson);
    tempDirs.push(dir);
    return dir;
  }

  afterAll(() => {
    tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  });

  it('should build a manifest with the plugin id, version and a sha256 hash per file', async () => {
    const dir = pluginDistDir({
      'module.js': 'console.log("hello");',
      'README.md': '# readme',
    });

    const manifest = await buildManifest(dir);

    expect(manifest.plugin).toBe('grafana-test-app');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.files).toEqual({
      'plugin.json': sha256(JSON.stringify(DEFAULT_PLUGIN_JSON)),
      'module.js': sha256('console.log("hello");'),
      'README.md': sha256('# readme'),
    });
  });

  it('should include files in nested directories using posix paths', async () => {
    const dir = pluginDistDir({
      'img/logo.svg': '<svg></svg>',
      'nested/deeply/file.txt': 'nested content',
    });

    const manifest = await buildManifest(dir);

    expect(manifest.files['img/logo.svg']).toBe(sha256('<svg></svg>'));
    expect(manifest.files['nested/deeply/file.txt']).toBe(sha256('nested content'));
    expect(Object.keys(manifest.files).every((filePath) => !filePath.includes('\\'))).toBe(true);
  });

  it('should exclude an existing MANIFEST.txt from the manifest', async () => {
    const dir = pluginDistDir({
      'module.js': 'export {};',
      'MANIFEST.txt': 'a previously signed manifest',
    });

    const manifest = await buildManifest(dir);

    expect(manifest.files['MANIFEST.txt']).toBeUndefined();
    expect(manifest.files['module.js']).toBeDefined();
  });

  it('should include symbolic links that resolve to files inside the plugin directory', async () => {
    const dir = pluginDistDir({
      'module.js': 'export {};',
    });
    symlinkSync(path.join(dir, 'module.js'), path.join(dir, 'module-link.js'));

    const manifest = await buildManifest(dir);

    expect(manifest.files['module.js']).toBe(sha256('export {};'));
    expect(manifest.files['module-link.js']).toBe(sha256('export {};'));
  });

  it('should throw when a symbolic link targets a file outside the plugin directory', async () => {
    const outsideDir = createTempDir();
    tempDirs.push(outsideDir);
    writeFiles(outsideDir, { 'secret.txt': 'secret' });

    const dir = pluginDistDir();
    symlinkSync(path.join(outsideDir, 'secret.txt'), path.join(dir, 'secret-link.txt'));

    await expect(buildManifest(dir)).rejects.toThrow(/targets a file outside of the base directory/);
  });

  it('should throw when a symbolic link targets a sibling directory sharing the plugin directory prefix', async () => {
    const containerDir = createTempDir();
    tempDirs.push(containerDir);
    const dir = path.join(containerDir, 'plugin');
    const siblingDir = path.join(containerDir, 'plugin-evil');
    writeFiles(dir, { 'plugin.json': JSON.stringify(DEFAULT_PLUGIN_JSON) });
    writeFiles(siblingDir, { 'secret.txt': 'secret' });
    symlinkSync(path.join(siblingDir, 'secret.txt'), path.join(dir, 'secret-link.txt'));

    await expect(buildManifest(dir)).rejects.toThrow(/targets a file outside of the base directory/);
  });

  it('should throw when plugin.json is missing', async () => {
    const dir = createTempDir();
    tempDirs.push(dir);
    writeFileSync(path.join(dir, 'module.js'), 'export {};');

    await expect(buildManifest(dir)).rejects.toThrow();
  });
});

describe('signManifest', () => {
  const manifest: ManifestInfo = {
    plugin: 'grafana-test-app',
    version: '1.0.0',
    files: { 'plugin.json': 'hash' },
  };

  beforeEach(() => {
    vi.stubEnv('GRAFANA_COM_URL', undefined);
    mocks.postData.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return the signed manifest when the API responds with status 200', async () => {
    mocks.postData.mockResolvedValue({ status: 200, data: 'SIGNED-MANIFEST' });

    const signedManifest = await signManifest(manifest, 'test-token');

    expect(signedManifest).toBe('SIGNED-MANIFEST');
    expect(mocks.postData).toHaveBeenCalledWith('https://grafana.com/api/plugins/ci/sign', manifest, {
      Authorization: 'Bearer test-token',
    });
  });

  it('should throw with the status code and server details when the API responds with an error', async () => {
    mocks.postData.mockResolvedValue({ status: 400, data: JSON.stringify({ message: 'invalid plugin' }) });

    await expect(signManifest(manifest, 'test-token')).rejects.toThrow(
      'Server responded with status code 400 along with: message: invalid plugin'
    );
  });

  it('should throw with the raw response body when the error response is not JSON', async () => {
    mocks.postData.mockResolvedValue({ status: 500, data: 'Internal Server Error' });

    await expect(signManifest(manifest, 'test-token')).rejects.toThrow(
      'Server responded with status code 500 along with: Internal Server Error'
    );
  });

  it('should propagate network errors', async () => {
    mocks.postData.mockRejectedValue(new Error('socket hang up'));

    await expect(signManifest(manifest, 'test-token')).rejects.toThrow('socket hang up');
  });
});

describe('saveManifest', () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  });

  it('should write the signed manifest to MANIFEST.txt', () => {
    const dir = createTempDir();
    tempDirs.push(dir);

    const result = saveManifest(dir, 'SIGNED-MANIFEST');

    expect(result).toBe(true);
    expect(readFileSync(path.join(dir, 'MANIFEST.txt'), 'utf-8')).toBe('SIGNED-MANIFEST');
  });

  it('should throw when the directory is not writable', () => {
    expect(() => saveManifest('/path/that/does/not/exist', 'SIGNED-MANIFEST')).toThrow(
      'Failed to write signed manifest to /path/that/does/not/exist.'
    );
  });
});

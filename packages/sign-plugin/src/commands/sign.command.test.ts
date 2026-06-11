import minimist from 'minimist';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { MockInstance, vi } from 'vitest';
import { sign } from './sign.command.js';
import { ManifestInfo } from '../utils/manifest.js';
import { createPluginDistDir, createTempDir, writeFiles } from '../utils/tests/fixtures.js';

const mocks = vi.hoisted(() => {
  return {
    postData: vi.fn(),
  };
});

vi.mock('../utils/request.js', () => {
  return { postData: mocks.postData };
});

const PROCESS_EXIT_MESSAGE = 'process.exit called';

function argvFor(args: Record<string, unknown> = {}): minimist.ParsedArgs {
  return { _: [], ...args } as minimist.ParsedArgs;
}

function getPostedManifest(): ManifestInfo {
  return mocks.postData.mock.calls[0][1] as ManifestInfo;
}

describe('sign command', () => {
  const tempDirs: string[] = [];
  let stdoutSpy: MockInstance<typeof process.stdout.write>;
  let exitSpy: MockInstance<typeof process.exit>;

  function pluginDistDir(files: Record<string, string> = {}) {
    const dir = createPluginDistDir(files);
    tempDirs.push(dir);
    return dir;
  }

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error(PROCESS_EXIT_MESSAGE);
    });
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.stubEnv('GRAFANA_ACCESS_POLICY_TOKEN', 'test-token');
    vi.stubEnv('GRAFANA_API_KEY', undefined);
    vi.stubEnv('GRAFANA_COM_URL', undefined);
    mocks.postData.mockReset().mockResolvedValue({ status: 200, data: 'SIGNED-MANIFEST' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  });

  it('should exit when the plugin dist directory does not exist', async () => {
    await expect(sign(argvFor({ distDir: '/path/that/does/not/exist' }))).rejects.toThrow(PROCESS_EXIT_MESSAGE);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mocks.postData).not.toHaveBeenCalled();
  });

  it('should post the manifest to the Grafana API and save the signed response', async () => {
    const dir = pluginDistDir({ 'module.js': 'export {};' });

    await sign(argvFor({ distDir: dir }));

    const [url, manifest, headers] = mocks.postData.mock.calls[0];
    expect(url).toBe('https://grafana.com/api/plugins/ci/sign');
    expect(headers).toEqual({ Authorization: 'Bearer test-token' });
    expect(manifest).toMatchObject({
      plugin: 'grafana-test-app',
      version: '1.0.0',
      signPlugin: { version: expect.any(String) },
    });
    expect(readFileSync(path.join(dir, 'MANIFEST.txt'), 'utf-8')).toBe('SIGNED-MANIFEST');
  });

  it('should respect the GRAFANA_COM_URL environment variable', async () => {
    vi.stubEnv('GRAFANA_COM_URL', 'https://grafana-dev.com/api');
    const dir = pluginDistDir();

    await sign(argvFor({ distDir: dir }));

    expect(mocks.postData.mock.calls[0][0]).toBe('https://grafana-dev.com/api/plugins/ci/sign');
  });

  it('should pass signatureType and rootUrls to the manifest', async () => {
    const dir = pluginDistDir();

    await sign(
      argvFor({
        distDir: dir,
        signatureType: 'private',
        rootUrls: 'https://example.com/grafana,https://grafana.example.com',
      })
    );

    expect(getPostedManifest()).toMatchObject({
      signatureType: 'private',
      rootUrls: ['https://example.com/grafana', 'https://grafana.example.com'],
    });
  });

  it('should exit without calling the API when a root URL is invalid', async () => {
    const dir = pluginDistDir();

    await expect(sign(argvFor({ distDir: dir, rootUrls: 'not-a-valid-url' }))).rejects.toThrow(PROCESS_EXIT_MESSAGE);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mocks.postData).not.toHaveBeenCalled();
    expect(existsSync(path.join(dir, 'MANIFEST.txt'))).toBe(false);
  });

  it('should exit without calling the API when no token is configured', async () => {
    vi.stubEnv('GRAFANA_ACCESS_POLICY_TOKEN', undefined);
    const dir = pluginDistDir();

    await expect(sign(argvFor({ distDir: dir }))).rejects.toThrow(PROCESS_EXIT_MESSAGE);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mocks.postData).not.toHaveBeenCalled();
  });

  it('should warn about deprecation but proceed when only GRAFANA_API_KEY is set', async () => {
    vi.stubEnv('GRAFANA_ACCESS_POLICY_TOKEN', undefined);
    vi.stubEnv('GRAFANA_API_KEY', 'legacy-api-key');
    const dir = pluginDistDir();

    await sign(argvFor({ distDir: dir }));

    const stdout = stdoutSpy.mock.calls.map((call) => String(call[0])).join('');
    expect(stdout).toContain('deprecated');
    expect(mocks.postData.mock.calls[0][2]).toEqual({ Authorization: 'Bearer legacy-api-key' });
  });

  it('should exit without saving the manifest when the API responds with an error', async () => {
    mocks.postData.mockResolvedValue({ status: 400, data: JSON.stringify({ message: 'invalid plugin' }) });
    const dir = pluginDistDir();

    await expect(sign(argvFor({ distDir: dir }))).rejects.toThrow(PROCESS_EXIT_MESSAGE);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(existsSync(path.join(dir, 'MANIFEST.txt'))).toBe(false);
  });

  it('should exit when the API request fails', async () => {
    mocks.postData.mockRejectedValue(new Error('socket hang up'));
    const dir = pluginDistDir();

    await expect(sign(argvFor({ distDir: dir }))).rejects.toThrow(PROCESS_EXIT_MESSAGE);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(existsSync(path.join(dir, 'MANIFEST.txt'))).toBe(false);
  });

  it('should add the create-plugin version from .config/.cprc.json to the manifest', async () => {
    const cwdDir = createTempDir();
    tempDirs.push(cwdDir);
    writeFiles(cwdDir, { '.config/.cprc.json': JSON.stringify({ version: '5.0.0' }) });
    vi.spyOn(process, 'cwd').mockReturnValue(cwdDir);
    const dir = pluginDistDir();

    await sign(argvFor({ distDir: dir }));

    expect(getPostedManifest().createPlugin).toEqual({ version: '5.0.0' });
  });
});

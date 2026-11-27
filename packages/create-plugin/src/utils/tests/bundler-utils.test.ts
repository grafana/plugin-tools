import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { dirSync } from 'tmp';
import { vi } from 'vitest';

import { TEMPLATE_PATHS } from '../../constants.js';

const tmpObj = dirSync({ unsafeCleanup: true });

// The scaffolded .config must work wherever it lives (a plugin root, or a shared root in a monorepo).
// It can't rely on __dirname or import.meta, because the config loads as CommonJS through ts-node
// or as an ES module through Node's type stripping.
describe('templates / .config/bundler/utils.ts', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(tmpObj.name, 'project-'));
    fs.mkdirSync(path.join(projectRoot, '.config'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'plugins', 'a', 'src'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, '.config', '.cprc.json'), JSON.stringify({ version: '7.12.0' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    tmpObj.removeCallback();
  });

  async function importBundlerUtils() {
    const bundlerUtilsUrl = pathToFileURL(path.join(TEMPLATE_PATHS.common, '.config', 'bundler', 'utils.ts')).href;
    return import(bundlerUtilsUrl);
  }

  it('reads .cprc.json from the plugin root', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot);
    const { getCPConfigVersion, getConfigDir } = await importBundlerUtils();

    expect(getConfigDir()).toBe(path.join(projectRoot, '.config'));
    expect(getCPConfigVersion()).toBe('7.12.0');
  });

  it('reads .cprc.json from a .config directory above the plugin being built', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(projectRoot, 'plugins', 'a'));
    const { getCPConfigVersion, getConfigDir } = await importBundlerUtils();

    expect(getConfigDir()).toBe(path.join(projectRoot, '.config'));
    expect(getCPConfigVersion()).toBe('7.12.0');
  });
});

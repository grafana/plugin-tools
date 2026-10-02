import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { dirSync } from 'tmp';
import { vi } from 'vitest';

import { runCodemod } from './runner.js';

vi.mock('../utils/utils.console.js', () => ({
  output: {
    log: vi.fn(),
    addHorizontalLine: vi.fn(),
    logSingleLine: vi.fn(),
    bulletList: vi.fn().mockReturnValue([]),
  },
}));

const tmpObj = dirSync({ unsafeCleanup: true });

describe('runCodemod', () => {
  let projectRoot: string;
  let codemodPath: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(tmpObj.name, 'project-'));
    fs.mkdirSync(path.join(projectRoot, '.config'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, '.config', '.cprc.json'), JSON.stringify({ version: '7.0.0' }));

    codemodPath = path.join(tmpObj.name, `codemod-${path.basename(projectRoot)}.mjs`);
    fs.writeFileSync(
      codemodPath,
      `export default function (context) { context.addFile('added.txt', 'added'); return context; }`
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    tmpObj.removeCallback();
  });

  it('runs once against a monorepo root with every plugin when started inside a plugin', async () => {
    const monorepoRoot = fs.mkdtempSync(path.join(tmpObj.name, 'monorepo-'));
    fs.mkdirSync(path.join(monorepoRoot, '.config'), { recursive: true });
    fs.writeFileSync(path.join(monorepoRoot, '.config', '.cprc.json'), JSON.stringify({ version: '7.0.0' }));
    fs.writeFileSync(path.join(monorepoRoot, 'package.json'), JSON.stringify({ workspaces: ['.config', 'plugins/*'] }));
    for (const plugin of ['a', 'b']) {
      fs.mkdirSync(path.join(monorepoRoot, 'plugins', plugin, 'src'), { recursive: true });
      fs.writeFileSync(path.join(monorepoRoot, 'plugins', plugin, 'src', 'plugin.json'), '{}');
    }
    const perPluginCodemodPath = path.join(tmpObj.name, `codemod-per-plugin-${path.basename(monorepoRoot)}.mjs`);
    fs.writeFileSync(
      perPluginCodemodPath,
      `export default function (context) {
        for (const plugin of context.project.plugins) {
          context.addFile(plugin.dir + '/touched.txt', plugin.dir);
        }
        return context;
      }`
    );
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(monorepoRoot, 'plugins', 'b', 'src'));

    const context = await runCodemod({
      name: 'per-plugin fixture',
      description: 'touches every plugin',
      scriptPath: pathToFileURL(perPluginCodemodPath).href,
    });

    expect(context.basePath).toBe(monorepoRoot);
    expect(context.project.kind).toBe('monorepo');
    expect(fs.readFileSync(path.join(monorepoRoot, 'plugins', 'a', 'touched.txt'), 'utf-8')).toBe('plugins/a');
    expect(fs.readFileSync(path.join(monorepoRoot, 'plugins', 'b', 'touched.txt'), 'utf-8')).toBe('plugins/b');
  });

  it('runs against the project root when started from a nested directory', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(projectRoot, 'src'));

    const context = await runCodemod({
      name: 'fixture',
      description: 'adds a file',
      scriptPath: pathToFileURL(codemodPath).href,
    });

    expect(context.basePath).toBe(projectRoot);
    expect(context.project).toEqual({ root: projectRoot, kind: 'single', plugins: [{ dir: '.' }] });
    expect(fs.readFileSync(path.join(projectRoot, 'added.txt'), 'utf-8')).toBe('added');
  });
});

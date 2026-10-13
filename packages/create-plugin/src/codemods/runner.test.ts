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

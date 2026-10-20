import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildDocs } from './build.command.js';
import { validateCommand } from './validate.command.js';
import { guidesLocation } from '../utils/utils.guides.js';

describe('validateCommand', () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  const run = (docsPath: string, json: boolean) => validateCommand(docsPath, { json });

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'plugin-docs-validate-'));
    await writeFile(
      join(tmpDir, 'index.md'),
      '---\ntitle: Home\ndescription: The landing page of the docs.\n---\n\nSome content.\n'
    );
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    process.exitCode = undefined;
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('adds the location of the guides to the JSON output', async () => {
    await run(tmpDir, true);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.guide).toBe(guidesLocation());
    expect(output.guide.endsWith(join('docs', 'index.md'))).toBe(true);
    expect(output).toHaveProperty('valid');
    expect(output).toHaveProperty('diagnostics');
  });

  it('prints the location of the guides after the results in text output', async () => {
    await run(tmpDir, false);

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy.mock.calls[1][0]).toBe(`\nDocs guides: ${guidesLocation()}`);
  });

  it('validates built docs in dist mode', async () => {
    const builtRoot = await mkdtemp(join(tmpdir(), 'plugin-docs-validate-dist-'));
    try {
      await mkdir(join(builtRoot, 'docs'));
      await writeFile(
        join(builtRoot, 'docs', 'index.md'),
        '---\ntitle: Home\ndescription: The landing page of the docs.\n---\n\nSome content.\n'
      );
      await buildDocs(builtRoot, join(builtRoot, 'docs'));
      logSpy.mockClear();
      const builtDocs = join(builtRoot, 'dist', 'docs');

      await validateCommand(builtDocs, { json: true, mode: 'dist' });
      expect(JSON.parse(logSpy.mock.calls[0][0] as string).valid).toBe(true);
      expect(process.exitCode).toBe(0);

      await rm(join(builtDocs, 'manifest.json'));
      await validateCommand(builtDocs, { json: true, mode: 'dist' });
      const output = JSON.parse(logSpy.mock.calls[1][0] as string);
      expect(output.valid).toBe(false);
      expect(output.diagnostics.map((d: { rule: string }) => d.rule)).toContain('dist-manifest-exists');
      expect(process.exitCode).toBe(1);
    } finally {
      await rm(builtRoot, { recursive: true, force: true });
    }
  });

  it('sets the exit code from the validation result', async () => {
    await run(join(tmpDir, 'missing'), true);
    expect(JSON.parse(logSpy.mock.calls[0][0] as string).valid).toBe(false);
    expect(process.exitCode).toBe(1);

    await run(tmpDir, true);
    expect(JSON.parse(logSpy.mock.calls[1][0] as string).valid).toBe(true);
    expect(process.exitCode).toBe(0);
  });
});

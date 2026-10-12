import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateCommand } from './validate.command.js';
import { guidesLocation } from '../utils/utils.guides.js';

describe('validateCommand', () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

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
    await validateCommand(tmpDir, { strict: true, json: true });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.guide).toBe(guidesLocation());
    expect(output.guide.endsWith(join('docs', 'index.md'))).toBe(true);
    expect(output).toHaveProperty('valid');
    expect(output).toHaveProperty('diagnostics');
  });

  it('prints the location of the guides after the results in text output', async () => {
    await validateCommand(tmpDir, { strict: true, json: false });

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy.mock.calls[1][0]).toBe(`\nDocs guides: ${guidesLocation()}`);
  });

  it('sets the exit code from the validation result', async () => {
    await validateCommand(join(tmpDir, 'missing'), { strict: true, json: true });
    expect(JSON.parse(logSpy.mock.calls[0][0] as string).valid).toBe(false);
    expect(process.exitCode).toBe(1);

    await validateCommand(tmpDir, { strict: true, json: true });
    expect(JSON.parse(logSpy.mock.calls[1][0] as string).valid).toBe(true);
    expect(process.exitCode).toBe(0);
  });
});

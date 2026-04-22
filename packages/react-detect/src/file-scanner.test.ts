import { describe, it, expect } from 'vitest';
import { findSourceMapFiles } from './file-scanner.js';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('findSourceMapFiles', () => {
  it('searches the given directory directly without appending a dist subdirectory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'react-detect-test-'));
    writeFileSync(join(dir, 'module.js.map'), '{}');

    const files = await findSourceMapFiles(dir);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('module.js.map');
  });

  it('finds source map files recursively within the given directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'react-detect-test-'));
    mkdirSync(join(dir, 'nested'));
    writeFileSync(join(dir, 'a.js.map'), '{}');
    writeFileSync(join(dir, 'nested', 'b.js.map'), '{}');

    const files = await findSourceMapFiles(dir);

    expect(files).toHaveLength(2);
  });

  it('returns empty array when no source map files exist', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'react-detect-test-'));

    const files = await findSourceMapFiles(dir);

    expect(files).toHaveLength(0);
  });
});

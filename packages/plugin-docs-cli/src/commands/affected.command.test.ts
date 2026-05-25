import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { affectedCommand } from './affected.command.js';

describe('affectedCommand', () => {
  let docsDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let logged: string[];

  beforeEach(() => {
    docsDir = mkdtempSync(join(tmpdir(), 'affected-test-'));
    logged = [];
    logSpy = vi.spyOn(console, 'log').mockImplementation((msg: unknown) => {
      logged.push(String(msg));
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
    rmSync(docsDir, { recursive: true, force: true });
  });

  function writeDoc(relativePath: string, frontmatter: Record<string, unknown>): void {
    const file = join(docsDir, relativePath);
    mkdirSync(join(file, '..'), { recursive: true });
    const lines = ['---'];
    for (const [k, v] of Object.entries(frontmatter)) {
      if (Array.isArray(v)) {
        lines.push(`${k}:`);
        for (const entry of v) {
          lines.push(`  - ${entry}`);
        }
      } else {
        lines.push(`${k}: ${JSON.stringify(v)}`);
      }
    }
    lines.push('---', '', '# heading', '');
    writeFileSync(file, lines.join('\n'));
  }

  it('prints docs whose relatedSources match the source path', async () => {
    writeDoc('query-editor.md', {
      title: 'Query editor',
      description: 'foo',
      relatedSources: ['src/components/QueryEditor.tsx', 'src/types.ts'],
    });
    writeDoc('configuration.md', {
      title: 'Configuration',
      description: 'foo',
      relatedSources: ['src/components/ConfigEditor.tsx'],
    });

    await affectedCommand(docsDir, { source: 'src/components/QueryEditor.tsx' });

    expect(logged).toHaveLength(1);
    expect(logged[0]).toContain('query-editor.md');
  });

  it('matches multiple docs when several reference the same source', async () => {
    writeDoc('a.md', { title: 'A', description: 'd', relatedSources: ['src/datasource.ts'] });
    writeDoc('b.md', { title: 'B', description: 'd', relatedSources: ['src/datasource.ts', 'src/types.ts'] });

    await affectedCommand(docsDir, { source: 'src/datasource.ts' });

    expect(logged).toHaveLength(2);
    expect(logged.some((m) => m.endsWith('a.md'))).toBe(true);
    expect(logged.some((m) => m.endsWith('b.md'))).toBe(true);
  });

  it('prints nothing when no doc references the source', async () => {
    writeDoc('only.md', { title: 'X', description: 'd', relatedSources: ['src/foo.ts'] });

    await affectedCommand(docsDir, { source: 'src/bar.ts' });

    expect(logged).toHaveLength(0);
  });

  it('skips pages without relatedSources', async () => {
    writeDoc('no-related.md', { title: 'X', description: 'd' });
    writeDoc('with-related.md', { title: 'Y', description: 'd', relatedSources: ['src/foo.ts'] });

    await affectedCommand(docsDir, { source: 'src/foo.ts' });

    expect(logged).toHaveLength(1);
    expect(logged[0]).toContain('with-related.md');
  });

  it('normalizes leading ./ and trailing slashes when matching', async () => {
    writeDoc('a.md', { title: 'A', description: 'd', relatedSources: ['./src/foo.ts'] });

    await affectedCommand(docsDir, { source: 'src/foo.ts' });

    expect(logged).toHaveLength(1);
  });

  it('recurses into nested directories', async () => {
    writeDoc('guides/setup.md', { title: 'Setup', description: 'd', relatedSources: ['src/foo.ts'] });

    await affectedCommand(docsDir, { source: 'src/foo.ts' });

    expect(logged).toHaveLength(1);
    expect(logged[0]).toContain('setup.md');
  });
});

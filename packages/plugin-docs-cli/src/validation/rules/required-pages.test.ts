import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkRequiredPages } from './required-pages.js';
import { Rule } from '../types.js';

async function makeDocsDir() {
  return mkdtemp(join(tmpdir(), 'required-pages-test-'));
}

describe('checkRequiredPages', () => {
  it('reports nothing for an unknown plugin type', async () => {
    const docsPath = await makeDocsDir();

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'app' });

    expect(findings).toHaveLength(0);
  });

  it('reports nothing when pluginType is unset', async () => {
    const docsPath = await makeDocsDir();

    const findings = await checkRequiredPages({ docsPath, strict: true });

    expect(findings).toHaveLength(0);
  });

  it('reports nothing for a plugin type that collides with an Object.prototype key', async () => {
    const docsPath = await makeDocsDir();

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'constructor' });

    expect(findings).toHaveLength(0);
  });

  it('reports nothing when the docs path does not exist', async () => {
    const findings = await checkRequiredPages({ docsPath: '/nonexistent/path', strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('passes a panel plugin with all three required pages as files', async () => {
    const docsPath = await makeDocsDir();
    await writeFile(join(docsPath, 'options.md'), '---\ntitle: Options\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: Data formats\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: Troubleshooting\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('passes a datasource plugin with all three required pages as folders', async () => {
    const docsPath = await makeDocsDir();
    for (const name of ['query-editor', 'configuration', 'troubleshooting']) {
      await mkdir(join(docsPath, name));
      await writeFile(join(docsPath, name, 'index.md'), '---\ntitle: X\n---\n');
    }

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'datasource' });

    expect(findings).toHaveLength(0);
  });

  it('passes a mix of file and folder forms', async () => {
    const docsPath = await makeDocsDir();
    await writeFile(join(docsPath, 'options.md'), '---\ntitle: Options\n---\n');
    await mkdir(join(docsPath, 'data-formats'));
    await writeFile(join(docsPath, 'data-formats', 'index.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: Troubleshooting\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('accepts a folder whose only page is nested deeper inside it', async () => {
    const docsPath = await makeDocsDir();
    await mkdir(join(docsPath, 'options', 'advanced'), { recursive: true });
    await writeFile(join(docsPath, 'options', 'advanced', 'thresholds.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('reports exactly one error for a single missing page', async () => {
    const docsPath = await makeDocsDir();
    await writeFile(join(docsPath, 'options.md'), '---\ntitle: Options\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: Troubleshooting\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe(Rule.RequiredPages);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].title).toContain('data-formats');
  });

  it('reports three errors when a datasource plugin has no docs at all', async () => {
    const docsPath = await makeDocsDir();
    await writeFile(join(docsPath, 'index.md'), '---\ntitle: Home\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'datasource' });

    expect(findings).toHaveLength(3);
    expect(findings.every((f) => f.rule === Rule.RequiredPages && f.severity === 'error')).toBe(true);
  });

  it('reports an error when the folder exists but has no markdown page', async () => {
    const docsPath = await makeDocsDir();
    await mkdir(join(docsPath, 'options'));
    await writeFile(join(docsPath, 'options', 'diagram.png'), '');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('reports an error when the folder only has a page under node_modules or dist', async () => {
    const docsPath = await makeDocsDir();
    await mkdir(join(docsPath, 'options', 'node_modules', 'pkg'), { recursive: true });
    await writeFile(join(docsPath, 'options', 'node_modules', 'pkg', 'readme.md'), '# readme');
    await mkdir(join(docsPath, 'options', 'dist'));
    await writeFile(join(docsPath, 'options', 'dist', 'page.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('reports an error when the folder only has an uppercase .MD file', async () => {
    const docsPath = await makeDocsDir();
    await mkdir(join(docsPath, 'options'));
    await writeFile(join(docsPath, 'options', 'GUIDE.MD'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('reports an error when the folder only has a meta file', async () => {
    const docsPath = await makeDocsDir();
    await mkdir(join(docsPath, 'options'));
    await writeFile(join(docsPath, 'options', 'README.md'), '# readme');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('does not accept a required page nested under a subfolder instead of at the root', async () => {
    const docsPath = await makeDocsDir();
    await mkdir(join(docsPath, 'guides'));
    await writeFile(join(docsPath, 'guides', 'options.md'), '---\ntitle: Options\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'troubleshooting.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, strict: true, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('reports errors even outside strict mode', async () => {
    const docsPath = await makeDocsDir();

    const findings = await checkRequiredPages({ docsPath, strict: false, pluginType: 'panel' });

    expect(findings).toHaveLength(3);
    expect(findings.every((f) => f.severity === 'error')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkRequiredPages } from './required-pages.js';
import { Rule } from '../types.js';

async function makeDocsDir() {
  return mkdtemp(join(tmpdir(), 'required-pages-test-'));
}

async function addPage(docsPath: string, name: string) {
  await writeFile(join(docsPath, `${name}.md`), '---\ntitle: X\n---\n');
}

describe('checkRequiredPages', () => {
  it('requires only troubleshooting for an app plugin', async () => {
    const docsPath = await makeDocsDir();

    const missing = await checkRequiredPages({ docsPath, pluginType: 'app' });
    await addPage(docsPath, 'troubleshooting');
    const present = await checkRequiredPages({ docsPath, pluginType: 'app' });

    expect(missing).toHaveLength(1);
    expect(missing[0].title).toContain('troubleshooting');
    expect(present).toHaveLength(0);
  });

  it('requires troubleshooting for a plugin type with no specific pages', async () => {
    const docsPath = await makeDocsDir();

    const findings = await checkRequiredPages({ docsPath, pluginType: 'renderer' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('troubleshooting');
  });

  it('reports nothing when pluginType is unset', async () => {
    const docsPath = await makeDocsDir();

    const findings = await checkRequiredPages({ docsPath });

    expect(findings).toHaveLength(0);
  });

  it('treats a plugin type that collides with an Object.prototype key as having no specific pages', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'constructor' });

    expect(findings).toHaveLength(0);
  });

  it('reports nothing when the docs path does not exist', async () => {
    const findings = await checkRequiredPages({ docsPath: '/nonexistent/path', pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('passes a panel plugin with all required pages as files', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await writeFile(join(docsPath, 'options.md'), '---\ntitle: Options\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: Data formats\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('passes a datasource plugin with all required pages as folders', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    for (const name of ['query-editor', 'configure']) {
      await mkdir(join(docsPath, name));
      await writeFile(join(docsPath, name, 'index.md'), '---\ntitle: X\n---\n');
    }

    const findings = await checkRequiredPages({ docsPath, pluginType: 'datasource' });

    expect(findings).toHaveLength(0);
  });

  it('passes a mix of file and folder forms', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await writeFile(join(docsPath, 'options.md'), '---\ntitle: Options\n---\n');
    await mkdir(join(docsPath, 'data-formats'));
    await writeFile(join(docsPath, 'data-formats', 'index.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('accepts a folder whose only page is nested deeper inside it', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await mkdir(join(docsPath, 'options', 'advanced'), { recursive: true });
    await writeFile(join(docsPath, 'options', 'advanced', 'thresholds.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(0);
  });

  it('requires examples for a panel plugin but not for a data source', async () => {
    const panelDocs = await makeDocsDir();
    for (const name of ['options', 'data-formats', 'troubleshooting']) {
      await addPage(panelDocs, name);
    }
    const datasourceDocs = await makeDocsDir();
    for (const name of ['query-editor', 'configure', 'troubleshooting']) {
      await addPage(datasourceDocs, name);
    }

    const panel = await checkRequiredPages({ docsPath: panelDocs, pluginType: 'panel' });
    const datasource = await checkRequiredPages({ docsPath: datasourceDocs, pluginType: 'datasource' });

    expect(panel).toHaveLength(1);
    expect(panel[0].title).toContain('examples');
    expect(datasource).toHaveLength(0);
  });

  it('reports exactly one error for a single missing page', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await writeFile(join(docsPath, 'options.md'), '---\ntitle: Options\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe(Rule.RequiredPages);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].title).toContain('data-formats');
  });

  it('reports three errors when a datasource plugin has no docs besides the landing page', async () => {
    const docsPath = await makeDocsDir();
    await writeFile(join(docsPath, 'index.md'), '---\ntitle: Home\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'datasource' });

    expect(findings).toHaveLength(3);
    expect(findings.every((f) => f.rule === Rule.RequiredPages && f.severity === 'error')).toBe(true);
  });

  it('reports an error when the folder exists but has no markdown page', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await mkdir(join(docsPath, 'options'));
    await writeFile(join(docsPath, 'options', 'diagram.png'), '');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('reports an error when the folder only has a page under node_modules or dist', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await mkdir(join(docsPath, 'options', 'node_modules', 'pkg'), { recursive: true });
    await writeFile(join(docsPath, 'options', 'node_modules', 'pkg', 'readme.md'), '# readme');
    await mkdir(join(docsPath, 'options', 'dist'));
    await writeFile(join(docsPath, 'options', 'dist', 'page.md'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('reports an error when the folder only has an uppercase .MD file', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await mkdir(join(docsPath, 'options'));
    await writeFile(join(docsPath, 'options', 'GUIDE.MD'), '---\ntitle: X\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('reports an error when the folder only has a meta file', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await mkdir(join(docsPath, 'options'));
    await writeFile(join(docsPath, 'options', 'README.md'), '# readme');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });

  it('does not accept a required page nested under a subfolder instead of at the root', async () => {
    const docsPath = await makeDocsDir();
    await addPage(docsPath, 'troubleshooting');
    await addPage(docsPath, 'examples');
    await mkdir(join(docsPath, 'guides'));
    await writeFile(join(docsPath, 'guides', 'options.md'), '---\ntitle: Options\n---\n');
    await writeFile(join(docsPath, 'data-formats.md'), '---\ntitle: X\n---\n');

    const findings = await checkRequiredPages({ docsPath, pluginType: 'panel' });

    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('options');
  });
});

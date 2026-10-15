import { describe, expect, it } from 'vitest';
import { Context } from '../../context.js';
import docsContent from './docs-content.js';

function makeContext(pluginJson: Record<string, unknown>, files: Record<string, string> = {}): Context {
  const context = new Context('/virtual');
  context.addFile('src/plugin.json', JSON.stringify(pluginJson));
  for (const [path, content] of Object.entries(files)) {
    context.addFile(path, content);
  }
  return context;
}

const wiredPanel = { type: 'panel', name: 'Clock', docsPath: 'catalog-docs' };

describe('docs-content', () => {
  it('should change nothing when catalog docs are set up', () => {
    const context = makeContext(wiredPanel, { 'catalog-docs/index.md': '# Clock\n' });
    const changesBefore = context.listChanges();

    const result = docsContent(context);

    expect(result.listChanges()).toEqual(changesBefore);
  });

  it('should be idempotent', async () => {
    const context = makeContext(wiredPanel, { 'catalog-docs/index.md': '# Clock\n' });

    await expect(docsContent).toBeIdempotent(context);
  });

  it('should stop when plugin.json has no docsPath', () => {
    const context = makeContext({ type: 'panel', name: 'Clock' });

    expect(() => docsContent(context)).toThrow(/no docsPath.*create-plugin add docs$/s);
  });

  it.each([
    ['is missing', {}],
    [
      'holds only files that are not pages',
      { 'catalog-docs/README.md': '# Notes\n', 'catalog-docs/AGENTS.md': '# A\n' },
    ],
    ['holds only images', { 'catalog-docs/img/clock.png': 'png' }],
  ])('should stop when the docs folder %s', (_label, files) => {
    const context = makeContext(wiredPanel, files);

    expect(() => docsContent(context)).toThrow(
      /'catalog-docs', but that folder has no docs pages.*create-plugin add docs --docsPath catalog-docs$/s
    );
  });

  it('should accept a docs folder whose pages all live in subfolders', () => {
    const context = makeContext(wiredPanel, {
      'catalog-docs/README.md': '# Notes\n',
      'catalog-docs/options/index.md': '# Options\n',
      'catalog-docs/guide/setup.md': '# Setup\n',
    });

    expect(() => docsContent(context)).not.toThrow();
  });

  it.each<unknown>(['../shared-docs', './docs', null, 5])('should stop when docsPath is %s', (docsPath) => {
    const context = makeContext({ ...wiredPanel, docsPath }, { 'catalog-docs/index.md': '# Clock\n' });

    expect(() => docsContent(context)).toThrow(
      `src/plugin.json has docsPath set to '${docsPath}', which create-plugin add docs-content can't use.`
    );
  });

  it('should name docs-content when the plugin type is not supported', () => {
    const context = makeContext({ ...wiredPanel, type: 'app' }, { 'catalog-docs/index.md': '# App\n' });

    expect(() => docsContent(context)).toThrow("create-plugin add docs-content does not support 'app' plugins yet");
  });
});

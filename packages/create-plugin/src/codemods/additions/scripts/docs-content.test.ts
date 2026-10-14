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

  it('should stop when the docs folder is missing', () => {
    const context = makeContext(wiredPanel);

    expect(() => docsContent(context)).toThrow(
      /'catalog-docs', but that folder is missing or empty.*create-plugin add docs --docsPath catalog-docs$/s
    );
  });

  it('should name docs-content when the plugin type is not supported', () => {
    const context = makeContext({ ...wiredPanel, type: 'app' }, { 'catalog-docs/index.md': '# App\n' });

    expect(() => docsContent(context)).toThrow("create-plugin add docs-content does not support 'app' plugins yet");
  });
});

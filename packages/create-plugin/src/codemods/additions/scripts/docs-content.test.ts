import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Context } from '../../context.js';
import docsContent, { allowScreenshotsOutsideSource } from './docs-content.js';

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
    const context = makeContext(wiredPanel, {
      'catalog-docs/index.md': '# Clock\n',
      'catalog-docs/AGENTS.md': '# Agents\n',
    });
    const changesBefore = context.listChanges();

    const result = docsContent(context);

    expect(result.listChanges()).toEqual(changesBefore);
  });

  it.each(['panel', 'datasource', 'app'])('should accept a %s plugin with catalog docs', (type) => {
    const context = makeContext(
      { ...wiredPanel, type },
      { 'catalog-docs/index.md': '# Intro\n', 'catalog-docs/AGENTS.md': '# Agents\n' }
    );

    expect(() => docsContent(context)).not.toThrow();
  });

  it('should be idempotent', async () => {
    const context = makeContext(wiredPanel, {
      'catalog-docs/index.md': '# Clock\n',
      'catalog-docs/AGENTS.md': '# Agents\n',
    });

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
      'catalog-docs/AGENTS.md': '# Agents\n',
      'catalog-docs/options/index.md': '# Options\n',
      'catalog-docs/guide/setup.md': '# Setup\n',
    });

    expect(() => docsContent(context)).not.toThrow();
  });

  it.each<unknown>(['../shared-docs', './docs', null, 5])('should stop when docsPath is %s', (docsPath) => {
    const context = makeContext(
      { ...wiredPanel, docsPath },
      { 'catalog-docs/index.md': '# Clock\n', 'catalog-docs/AGENTS.md': '# Agents\n' }
    );

    expect(() => docsContent(context)).toThrow(
      `src/plugin.json has docsPath set to '${docsPath}', which create-plugin add docs-content can't use.`
    );
  });

  it('should stop when the docs folder has pages but no AGENTS.md', () => {
    const context = makeContext(wiredPanel, { 'catalog-docs/index.md': '# Clock\n' });

    expect(() => docsContent(context)).toThrow(
      /catalog-docs\/AGENTS.md is missing.*create-plugin add docs --docsPath catalog-docs$/s
    );
  });

  it('should name docs-content when the plugin type is not supported', () => {
    const context = makeContext({ ...wiredPanel, type: 'renderer' }, { 'catalog-docs/index.md': '# Renderer\n' });

    expect(() => docsContent(context)).toThrow('create-plugin add docs-content needs a plugin type of panel');
  });
});

const COPY_FILES_PATH = '.config/bundler/copyFiles.ts';
const CONSTANTS_FILE = { '.config/bundler/constants.ts': "export const SOURCE_DIR = 'src';\n" };

const currentCopyFiles = readFileSync(
  new URL('../../../../templates/common/.config/bundler/copyFiles.ts', import.meta.url),
  'utf-8'
);

const previousCopyFiles = `import { getPluginJson, hasReadme } from './utils.ts';

const pluginJson = getPluginJson();
const logoPaths: string[] = Array.from(new Set([pluginJson.info?.logos?.large, pluginJson.info?.logos?.small])).filter(
  Boolean
);
const screenshotPaths: string[] = pluginJson.info?.screenshots?.map((s: { path: string }) => s.path) || [];

export const copyFilePatterns = [
  // If src/README.md exists use it; otherwise the root README
  // To \`compiler.options.output\`
  { from: hasReadme() ? 'README.md' : '../README.md', to: '.', force: true },
  { from: 'plugin.json', to: '.' },
  { from: '../LICENSE', to: '.' },
  { from: '../CHANGELOG.md', to: '.', force: true },
  { from: '**/*.json', to: '.' },
  { from: '**/query_help.md', to: '.', noErrorOnMissing: true },
  ...logoPaths.map((logoPath) => ({ from: logoPath, to: logoPath })),
  ...screenshotPaths.map((screenshotPath) => ({
    from: screenshotPath,
    to: screenshotPath,
  })),
];
`;

describe('allowScreenshotsOutsideSource', () => {
  it('should turn the previous bundler copyFiles.ts into the current template', () => {
    const context = makeContext(wiredPanel, { ...CONSTANTS_FILE, [COPY_FILES_PATH]: previousCopyFiles });

    allowScreenshotsOutsideSource(context);

    expect(context.getFile(COPY_FILES_PATH)).toBe(currentCopyFiles);
  });

  it('should update copyFiles.ts when docs-content runs', () => {
    const context = makeContext(wiredPanel, {
      'catalog-docs/index.md': '# Clock\n',
      'catalog-docs/AGENTS.md': '# Agents\n',
      ...CONSTANTS_FILE,
      [COPY_FILES_PATH]: previousCopyFiles,
    });

    expect(docsContent(context).getFile(COPY_FILES_PATH)).toBe(currentCopyFiles);
  });

  it('should leave a current copyFiles.ts alone', () => {
    const context = makeContext(wiredPanel, { ...CONSTANTS_FILE, [COPY_FILES_PATH]: currentCopyFiles });

    const before = context.getFile(COPY_FILES_PATH);

    allowScreenshotsOutsideSource(context);

    expect(context.getFile(COPY_FILES_PATH)).toBe(before);
  });

  it('should leave a customised copyFiles.ts alone', () => {
    const customised = previousCopyFiles.replace(
      '    from: screenshotPath,\n',
      '    from: `shots/${screenshotPath}`,\n'
    );
    const context = makeContext(wiredPanel, { ...CONSTANTS_FILE, [COPY_FILES_PATH]: customised });

    const before = context.getFile(COPY_FILES_PATH);

    allowScreenshotsOutsideSource(context);

    expect(context.getFile(COPY_FILES_PATH)).toBe(before);
  });

  it('should leave copyFiles.ts alone when constants.ts is missing', () => {
    const context = makeContext(wiredPanel, { [COPY_FILES_PATH]: previousCopyFiles });

    const before = context.getFile(COPY_FILES_PATH);

    allowScreenshotsOutsideSource(context);

    expect(context.getFile(COPY_FILES_PATH)).toBe(before);
  });

  it('should do nothing for a bundler config without copyFiles.ts', () => {
    const context = makeContext(wiredPanel, CONSTANTS_FILE);

    const before = context.getFile(COPY_FILES_PATH);

    allowScreenshotsOutsideSource(context);

    expect(context.getFile(COPY_FILES_PATH)).toBe(before);
  });
});

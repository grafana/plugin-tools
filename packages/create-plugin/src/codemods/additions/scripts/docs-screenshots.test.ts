import { describe, expect, it } from 'vitest';
import { Context } from '../../context.js';
import docsScreenshots from './docs-screenshots.js';

const panel = { type: 'panel', name: 'Clock', id: 'grafana-clock-panel', docsPath: 'catalog-docs' };
const e2ePackageJson = {
  scripts: { 'docs:validate': 'plugin-docs-cli validate' },
  devDependencies: { '@grafana/plugin-e2e': '^4.0.0', '@playwright/test': '^1.62.1' },
};
const docsFiles = {
  'catalog-docs/index.md': '# Clock\n\n<!-- screenshot: the clock panel -->\n',
  'catalog-docs/AGENTS.md': '# Agents\n',
  'playwright.config.ts': 'export default {};\n',
  '.config/AGENTS/instructions.md': '# Grafana Plugin\n',
};

function makeContext(
  pluginJson: Record<string, unknown> = panel,
  files: Record<string, string> = docsFiles,
  packageJson: Record<string, unknown> = e2ePackageJson
): Context {
  const context = new Context('/virtual');
  context.addFile('src/plugin.json', JSON.stringify(pluginJson));
  context.addFile('package.json', JSON.stringify(packageJson));
  for (const [path, content] of Object.entries(files)) {
    context.addFile(path, content);
  }
  return context;
}

describe('docs-screenshots', () => {
  it('should scaffold the screenshot project', () => {
    const result = docsScreenshots(makeContext());

    expect(result.getFile('docs-screenshots/playwright.config.ts')).toContain("from '../playwright.config'");
    expect(result.getFile('docs-screenshots/helpers.ts')).toContain("join(__dirname, '..', 'catalog-docs', 'img')");
    expect(result.getFile('docs-screenshots/example.spec.ts')).toContain('gotoDashboardPage');
  });

  it.each([
    ['datasource', 'createDataSourceConfigPage'],
    ['app', 'gotoAppPage'],
  ])('should add the %s example spec', (type, fixture) => {
    const result = docsScreenshots(makeContext({ ...panel, type }));
    const example = result.getFile('docs-screenshots/example.spec.ts');

    expect(example).toContain(fixture);
    expect(example).toContain("'grafana-clock-panel'");
  });

  it('should add the docs:screenshots script and keep the other scripts', () => {
    const result = docsScreenshots(makeContext());
    const { scripts } = JSON.parse(result.getFile('package.json') ?? '{}');

    expect(scripts).toEqual({
      'docs:validate': 'plugin-docs-cli validate',
      'docs:screenshots': 'playwright test --config docs-screenshots/playwright.config.ts && plugin-docs-cli validate',
    });
  });

  it('should keep a docs:screenshots script the author changed', () => {
    const packageJson = { ...e2ePackageJson, scripts: { 'docs:screenshots': 'custom' } };
    const result = docsScreenshots(makeContext(panel, docsFiles, packageJson));

    expect(JSON.parse(result.getFile('package.json') ?? '{}').scripts['docs:screenshots']).toBe('custom');
  });

  it('should add a docs screenshots section to the agent instructions', () => {
    const result = docsScreenshots(makeContext());
    const instructions = result.getFile('.config/AGENTS/instructions.md');

    expect(instructions).toContain('## Docs screenshots');
    expect(instructions).toContain('`catalog-docs/img/`');
    expect(instructions).toContain('`docs:screenshots`');
  });

  it('should keep files the author already has', () => {
    const result = docsScreenshots(
      makeContext(panel, {
        ...docsFiles,
        'docs-screenshots/helpers.ts': '// mine\n',
        'docs-screenshots/options.spec.ts': '// mine\n',
      })
    );

    expect(result.getFile('docs-screenshots/helpers.ts')).toBe('// mine\n');
    expect(result.doesFileExist('docs-screenshots/example.spec.ts')).toBe(false);
    expect(result.doesFileExist('docs-screenshots/playwright.config.ts')).toBe(true);
  });

  it('should tell the author to start Grafana first', () => {
    const result = docsScreenshots(makeContext());

    expect(result.getMessage()?.body?.join('\n')).toMatch(/start Grafana.*GRAFANA_URL/s);
  });

  it('should be idempotent', async () => {
    await expect(docsScreenshots).toBeIdempotent(makeContext());
  });

  it('should stop when the docs are not set up', () => {
    const context = makeContext({ type: 'panel', name: 'Clock', id: 'grafana-clock-panel' });

    expect(() => docsScreenshots(context)).toThrow(/no docsPath.*create-plugin add docs$/s);
  });

  it('should name docs-screenshots when the plugin type is not supported', () => {
    const context = makeContext({ ...panel, type: 'renderer' });

    expect(() => docsScreenshots(context)).toThrow('create-plugin add docs-screenshots needs a plugin type of panel');
  });

  it.each([
    ['@grafana/plugin-e2e', { '@playwright/test': '^1.62.1' }],
    ['@playwright/test', { '@grafana/plugin-e2e': '^4.0.0' }],
  ])('should stop when %s is missing', (missing, devDependencies) => {
    const context = makeContext(panel, docsFiles, { devDependencies });

    expect(() => docsScreenshots(context)).toThrow(`there's no ${missing} in devDependencies`);
  });

  it('should stop when there is no playwright.config.ts', () => {
    const { 'playwright.config.ts': _config, ...files } = docsFiles;
    const context = makeContext(panel, files);

    expect(() => docsScreenshots(context)).toThrow("there's no playwright.config.ts");
  });
});

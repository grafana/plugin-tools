import { describe, expect, it } from 'vitest';
import migrate from './023-fix-rspack-typecheck.js';
import { Context } from '../../context.js';

const LICENSE_PLUGIN_PATH = '.config/rspack/LicenseRspackPlugin.ts';
const CSS_PLUGIN_PATH = '.config/rspack/PluginCssRspackPlugin.ts';

const oldLicensePlugin = `const content = assets[assetName].source().toString();`;
const oldCssPlugin = `const dependencies = wrapper?.[1].split(',') ?? [];
const params = wrapper?.[2].split(',').map((param) => param.trim()) ?? [];
if (!fileName.endsWith('.css')) {
            const source = assets[assetName];
            const css = source.source().toString();
if (!url.startsWith(publicPath)) {
// the layer keeps Grafana's unlayered styles winning at equal specificity. @charset must stay first`;

function createContext() {
  const context = new Context('/virtual');
  context.addFile(LICENSE_PLUGIN_PATH, oldLicensePlugin);
  context.addFile(CSS_PLUGIN_PATH, oldCssPlugin);
  return context;
}

describe('023-fix-rspack-typecheck', () => {
  it('should guard indexed asset, regex, filename, and URL access', () => {
    const result = migrate(createContext());

    expect(result.getFile(LICENSE_PLUGIN_PATH)).toContain('if (!asset)');
    expect(result.getFile(LICENSE_PLUGIN_PATH)).toContain('asset.source()');
    expect(result.getFile(CSS_PLUGIN_PATH)).toContain("wrapper?.[1]?.split(',')");
    expect(result.getFile(CSS_PLUGIN_PATH)).toContain("wrapper?.[2]?.split(',')");
    expect(result.getFile(CSS_PLUGIN_PATH)).toContain("if (!fileName?.endsWith('.css'))");
    expect(result.getFile(CSS_PLUGIN_PATH)).toContain('if (!source)');
    expect(result.getFile(CSS_PLUGIN_PATH)).toContain('if (!url?.startsWith(publicPath))');
    expect(result.getFile(CSS_PLUGIN_PATH)).toContain("the layer keeps Grafana's non-layered styles winning");
  });

  it('should not modify files without matching old snippets', () => {
    const context = new Context('/virtual');
    context.addFile(LICENSE_PLUGIN_PATH, 'already fixed');
    context.addFile(CSS_PLUGIN_PATH, 'customized');

    const result = migrate(context);

    expect(result.getFile(LICENSE_PLUGIN_PATH)).toBe('already fixed');
    expect(result.getFile(CSS_PLUGIN_PATH)).toBe('customized');
  });

  it('should skip missing files', () => {
    const result = migrate(new Context('/virtual'));

    expect(result.hasChanges()).toBe(false);
  });

  it('should be idempotent', async () => {
    await expect(migrate).toBeIdempotent(createContext());
  });
});

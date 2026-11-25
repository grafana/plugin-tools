import type { Context } from '../../context.js';

const MIGRATIONS = [
  {
    path: '.config/rspack/LicenseRspackPlugin.ts',
    replacements: [
      [
        'const content = assets[assetName].source().toString();',
        `const asset = assets[assetName];
            if (!asset) {
              throw new Error(\`\${PLUGIN_NAME}: missing asset \${assetName}.\`);
            }
            const content = asset.source().toString();`,
      ],
    ],
  },
  {
    path: '.config/rspack/PluginCssRspackPlugin.ts',
    replacements: [
      ["const dependencies = wrapper?.[1].split(',') ?? [];", "const dependencies = wrapper?.[1]?.split(',') ?? [];"],
      [
        "const params = wrapper?.[2].split(',').map((param) => param.trim()) ?? [];",
        "const params = wrapper?.[2]?.split(',').map((param) => param.trim()) ?? [];",
      ],
      ["if (!fileName.endsWith('.css')) {", "if (!fileName?.endsWith('.css')) {"],
      [
        `const source = assets[assetName];
            const css = source.source().toString();`,
        `const source = assets[assetName];
            if (!source) {
              throw new Error(\`\${PLUGIN_NAME}: missing asset \${assetName}.\`);
            }
            const css = source.source().toString();`,
      ],
      ['if (!url.startsWith(publicPath)) {', 'if (!url?.startsWith(publicPath)) {'],
      [
        "// the layer keeps Grafana's unlayered styles winning at equal specificity. @charset must stay first",
        "// the layer keeps Grafana's non-layered styles winning at equal specificity. @charset must stay first",
      ],
    ],
  },
];

export default function migrate(context: Context): Context {
  for (const { path, replacements } of MIGRATIONS) {
    if (!context.doesFileExist(path)) {
      continue;
    }

    const originalContent = context.getFile(path);
    if (originalContent === undefined) {
      continue;
    }

    const updatedContent = replacements.reduce((content, [from, to]) => content.replace(from, to), originalContent);

    if (updatedContent !== originalContent) {
      context.updateFile(path, updatedContent);
    }
  }

  return context;
}

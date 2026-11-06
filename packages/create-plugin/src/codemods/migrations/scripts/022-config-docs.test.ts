import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEMPLATE_PATHS } from '../../../constants.js';
import { Context } from '../../context.js';
import migrate from './022-config-docs.js';

const README_PATH = '.config/README.md';
const intro = '# Build configuration\n\nKeep this introduction.\n\n';
const prettierSection = '### Extending the Prettier config\n\nKeep these project notes.\n';
const oldSection = [
  '### Extending the ESLint config',
  '',
  'Edit the `.eslintrc` file in the project root in order to extend the ESLint configuration.',
  '',
  '**Example:**',
  '',
  '```json',
  '{',
  '  "extends": "./.config/.eslintrc",',
  '  "rules": { "react/prop-types": "off" }',
  '}',
  '```',
  '',
  '---',
  '',
].join('\n');
const oldJestSection = `### Extending the Jest config

\`\`\`javascript
const { grafanaESModules, nodeModulesToTransform } = require('./config/jest/utils');
\`\`\`

---

`;
const webpackSection = `### Extending the Webpack config

\`\`\`typescript
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';
\`\`\`

---

`;
const oldReadme = intro + oldSection + oldJestSection + webpackSection + prettierSection;
const currentReadme = readFileSync(join(TEMPLATE_PATHS.common, README_PATH), 'utf8');

describe('022-config-docs', () => {
  it('replaces the legacy ESLint instructions and preserves the other sections', () => {
    const context = new Context('/virtual');
    context.addFile('eslint.config.mjs', 'export default [];');
    context.addFile(README_PATH, oldReadme);

    const result = migrate(context).getFile(README_PATH);

    expect(result).toContain('Edit the `eslint.config.mjs` file');
    expect(result).toContain("import { defineConfig } from 'eslint/config';");
    expect(result).toContain("import baseConfig from './.config/eslint.config.mjs';");
    expect(result).not.toContain('.eslintrc');
    expect(result?.startsWith(intro)).toBe(true);
    expect(result?.endsWith(prettierSection)).toBe(true);
    expect(result).toContain(oldJestSection);
    expect(result).toContain(webpackSection);
  });

  it('leaves the current generated README unchanged', () => {
    const context = new Context('/virtual');
    context.addFile('eslint.config.mjs', 'export default [];');
    context.addFile('.config/jest/utils.js', 'module.exports = {};');
    context.addFile(README_PATH, currentReadme);

    expect(migrate(context).getFile(README_PATH)).toBe(currentReadme);
  });

  it('repairs the Jest example independently of the ESLint config', () => {
    const context = new Context('/virtual');
    context.addFile('.config/jest/utils.js', 'module.exports = {};');
    context.addFile(README_PATH, oldReadme);

    const result = migrate(context).getFile(README_PATH);

    expect(result).toContain("require('./.config/jest/utils')");
    expect(result).toContain(webpackSection);
    expect(result).toContain(oldSection);
    expect(result?.startsWith(intro)).toBe(true);
    expect(result?.endsWith(prettierSection)).toBe(true);
  });

  it('leaves instructions for absent configuration files unchanged', () => {
    const context = new Context('/virtual');
    context.addFile('.config/jest/utils.js', 'module.exports = {};');
    context.addFile(README_PATH, oldReadme);

    const result = migrate(context).getFile(README_PATH);

    expect(result).toContain("require('./.config/jest/utils')");
    expect(result).toContain(oldSection);
    expect(result).toContain(webpackSection);
  });

  it('ships a template with the correct Jest helper path', () => {
    expect(currentReadme).toContain("require('./.config/jest/utils')");
    expect(currentReadme).not.toContain("require('./config/jest/utils')");
  });

  it('does not create a missing README', () => {
    const context = new Context('/virtual');
    context.addFile('eslint.config.mjs', 'export default [];');

    expect(migrate(context).getFile(README_PATH)).toBeUndefined();
  });

  it('leaves the README unchanged when the flat config is missing', () => {
    const context = new Context('/virtual');
    context.addFile(README_PATH, oldReadme);

    expect(migrate(context).getFile(README_PATH)).toBe(oldReadme);
  });

  it('preserves a custom ESLint section', () => {
    const context = new Context('/virtual');
    const readme = intro + '### Extending the ESLint config\n\nUse the team linting guide.\n\n' + prettierSection;
    context.addFile('eslint.config.mjs', 'export default [];');
    context.addFile(README_PATH, readme);

    expect(migrate(context).getFile(README_PATH)).toBe(readme);
  });

  it('is idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile('.config/jest/utils.js', 'module.exports = {};');
    context.addFile('eslint.config.mjs', 'export default [];');
    context.addFile(README_PATH, oldReadme);

    await expect(migrate).toBeIdempotent(context);
  });
});

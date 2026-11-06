import { describe, expect, it } from 'vitest';
import { Context } from '../../context.js';
import migrate from './022-config-docs.js';

const README_PATH = '.config/README.md';
const oldEslintSection = `### Extending the ESLint config

Edit \`.eslintrc\` and extend \`./.config/.eslintrc\`.

`;
const oldReadme = `${oldEslintSection}### Extending the Jest config

const { grafanaESModules, nodeModulesToTransform } = require('./config/jest/utils');
`;

describe('022-config-docs', () => {
  it('updates the outdated ESLint and Jest instructions', () => {
    const context = new Context('/virtual');
    context.addFile('eslint.config.mjs', 'export default [];');
    context.addFile('.config/jest/utils.js', 'module.exports = {};');
    context.addFile(README_PATH, oldReadme);

    const result = migrate(context).getFile(README_PATH);

    expect(result).toContain("import baseConfig from './.config/eslint.config.mjs';");
    expect(result).not.toContain('.eslintrc');
    expect(result).toContain("require('./.config/jest/utils')");
    expect(result).not.toContain("require('./config/jest/utils')");
  });

  it('repairs the Jest example without migrating legacy ESLint instructions', () => {
    const context = new Context('/virtual');
    context.addFile('.config/jest/utils.js', 'module.exports = {};');
    context.addFile(README_PATH, oldReadme);

    const result = migrate(context).getFile(README_PATH);

    expect(result).toContain("require('./.config/jest/utils')");
    expect(result).toContain(oldEslintSection);
  });

  it('is idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile('eslint.config.mjs', 'export default [];');
    context.addFile('.config/jest/utils.js', 'module.exports = {};');
    context.addFile(README_PATH, oldReadme);

    await expect(migrate).toBeIdempotent(context);
  });
});

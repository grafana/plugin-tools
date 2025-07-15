import migrate, { discoverRelativeLegacyConfigs } from './004-eslint9-flat-config.js';
import { createDefaultContext } from '../test-utils.js';
import { Context } from '../context.js';

describe('004-eslint9-flat-config', () => {
  describe('migration', () => {
    it('should migrate legacy eslint config with rules', async () => {
      const context = new Context('/virtual');

      context.addFile(
        '.eslintrc',
        JSON.stringify(
          {
            extends: ['@grafana/eslint-config'],
            root: true,
            rules: {
              'react/prop-types': 'off',
              'no-console': 'error',
            },
          },
          null,
          2
        )
      );

      const result = await migrate(context);

      const expectedConfig = `import { defineConfig } from "eslint/config";

export default defineConfig([{
  rules: {
    react/prop-types: "off",
    no-console: "error",
  },
}]);`;

      expect(result.listChanges()['eslint.config.mjs'].content).toBe(expectedConfig);
      expect(result.listChanges()).not.toHaveProperty('.eslintrc');
    });

    it('should not make additional changes when run multiple times', async () => {
      const context = await createDefaultContext();

      await expect(migrate).toBeIdempotent(context);
    });
  });

  describe('discoverRelativeLegacyConfigs', () => {
    it('should discover config files through extends', () => {
      const context = new Context('/virtual');
      context.addFile('.eslintrc', JSON.stringify({ extends: './.config/.eslintrc' }));
      context.addFile('.config/.eslintrc', JSON.stringify({ extends: './base.eslintrc' }));
      context.addFile('.config/base.eslintrc', JSON.stringify({ extends: '../root.eslintrc' }));
      context.addFile('root.eslintrc', JSON.stringify({ rules: { 'root-rule': 'error' } }));

      const result = discoverRelativeLegacyConfigs(context, '.eslintrc');

      expect(result.size).toBe(4);
      expect(result.has('.eslintrc')).toBe(true);
      expect(result.has('.config/.eslintrc')).toBe(true);
      expect(result.has('.config/base.eslintrc')).toBe(true);
      expect(result.has('root.eslintrc')).toBe(true);
    });

    it('should handle circular references gracefully', () => {
      const context = new Context('/virtual');
      context.addFile('.eslintrc', JSON.stringify({ extends: './circular.eslintrc' }));
      context.addFile('circular.eslintrc', JSON.stringify({ extends: './.eslintrc' }));

      const result = discoverRelativeLegacyConfigs(context, '.eslintrc');

      expect(result.size).toBe(2);
      expect(result.has('.eslintrc')).toBe(true);
      expect(result.has('circular.eslintrc')).toBe(true);
    });

    it('should filter out bare specifiers and non-relative extends', () => {
      const context = new Context('/virtual');
      context.addFile(
        '.eslintrc',
        JSON.stringify({
          extends: ['@grafana/eslint-config', './local.eslintrc', 'eslint:recommended', '@grafana/eslint-config'],
        })
      );
      context.addFile('local.eslintrc', JSON.stringify({ rules: { 'no-console': 'error' } }));

      const result = discoverRelativeLegacyConfigs(context, '.eslintrc');

      expect(result.size).toBe(2);
      expect(result.has('.eslintrc')).toBe(true);
      expect(result.has('local.eslintrc')).toBe(true);
    });

    it('should return empty map for non-existent config', () => {
      const context = new Context('/virtual');

      const result = discoverRelativeLegacyConfigs(context, 'nonexistent.eslintrc');

      expect(result.size).toBe(0);
    });

    it('should handle array and string extends consistently', () => {
      const context = new Context('/virtual');
      context.addFile('.eslintrc', JSON.stringify({ extends: './config.eslintrc' }));
      context.addFile('config.eslintrc', JSON.stringify({ extends: ['./subdir/base1.eslintrc', './base2.eslintrc'] }));
      context.addFile('subdir/base1.eslintrc', JSON.stringify({ rules: { rule1: 'error' } }));
      context.addFile('base2.eslintrc', JSON.stringify({ rules: { rule2: 'warn' } }));

      const result = discoverRelativeLegacyConfigs(context, '.eslintrc');

      expect(result.size).toBe(4);
      expect(result.has('.eslintrc')).toBe(true);
      expect(result.has('config.eslintrc')).toBe(true);
      expect(result.has('subdir/base1.eslintrc')).toBe(true);
      expect(result.has('base2.eslintrc')).toBe(true);
    });
  });
});

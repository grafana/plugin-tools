import { describe, expect, it } from 'vitest';

import { Context } from '../../../context.js';
import { updateEslintConfig } from './tooling.js';

describe('tooling', () => {
  describe('updateEslintConfig', () => {
    it('should add correct ESLint config with proper rules and options', () => {
      const context = new Context('/virtual');

      context.addFile(
        'eslint.config.mjs',
        'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
      );

      updateEslintConfig(context);

      const eslintConfig = context.getFile('eslint.config.mjs');

      // Check correct import (recast uses double quotes)
      expect(eslintConfig).toContain('import grafanaI18nPlugin from "@grafana/i18n/eslint-plugin"');

      // Check plugin registration
      expect(eslintConfig).toContain('"@grafana/i18n": grafanaI18nPlugin');

      // Check rules are present
      expect(eslintConfig).toContain('"@grafana/i18n/no-untranslated-strings"');
      expect(eslintConfig).toContain('"@grafana/i18n/no-translation-top-level"');

      // Check rule configuration
      expect(eslintConfig).toContain('"error"');
      expect(eslintConfig).toContain('calleesToIgnore');
      expect(eslintConfig).toContain('"^css$"');
      expect(eslintConfig).toContain('"use[A-Z].*"');

      // Check config name
      expect(eslintConfig).toContain('name: "grafana/i18n-rules"');
    });

    it('should not add ESLint config if already present', () => {
      const context = new Context('/virtual');

      context.addFile(
        'eslint.config.mjs',
        'import { defineConfig } from "eslint/config";\nimport grafanaI18nPlugin from "@grafana/i18n/eslint-plugin";\nexport default defineConfig([]);'
      );

      const originalContent = context.getFile('eslint.config.mjs');

      updateEslintConfig(context);

      // The ESLint config should remain unchanged
      const eslintConfig = context.getFile('eslint.config.mjs');
      expect(eslintConfig).toBe(originalContent);
      expect(eslintConfig).toContain('@grafana/i18n/eslint-plugin');
      // Should not have duplicate imports or configs
      const importCount = (eslintConfig?.match(/@grafana\/i18n\/eslint-plugin/g) || []).length;
      expect(importCount).toBe(1);
    });

    it('should handle missing eslint.config.mjs gracefully', () => {
      const context = new Context('/virtual');
      // No eslint.config.mjs file

      expect(() => {
        updateEslintConfig(context);
      }).not.toThrow();
    });

    it('should handle empty eslint.config.mjs gracefully', () => {
      const context = new Context('/virtual');

      context.addFile('eslint.config.mjs', '');

      expect(() => {
        updateEslintConfig(context);
      }).not.toThrow();
    });
  });
});

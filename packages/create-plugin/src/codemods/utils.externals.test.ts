import { describe, expect, it } from 'vitest';
import * as recast from 'recast';

import { Context } from './context.js';
import { updateExternalsArray, type ExternalsArrayModifier } from './utils.externals.js';

describe('updateExternalsArray', () => {
  describe('new structure (.config/bundler/externals.ts)', () => {
    it('should update externals array in externals.ts', () => {
      const context = new Context('/virtual');
      context.addFile('.config/bundler/externals.ts', `export const externals = ['react', 'react-dom'];`);

      const modifier: ExternalsArrayModifier = (array) => {
        array.elements.push(recast.types.builders.literal('i18next'));
        return true;
      };

      const result = updateExternalsArray(context, modifier);

      expect(result).toBe(true);
      const content = context.getFile('.config/bundler/externals.ts') || '';
      expect(content).toMatch(/['"]i18next['"]/);
      expect(content).toContain("'react'");
      expect(content).toContain("'react-dom'");
    });

    it('should return false if no changes were made', () => {
      const context = new Context('/virtual');
      context.addFile('.config/bundler/externals.ts', `export const externals = ['react', 'react-dom'];`);

      const modifier: ExternalsArrayModifier = () => {
        return false; // No changes
      };

      const result = updateExternalsArray(context, modifier);

      expect(result).toBe(false);
    });
  });

  describe('legacy structure (.config/webpack/webpack.config.ts)', () => {
    it('should update externals array in webpack.config.ts when externals.ts does not exist', () => {
      const context = new Context('/virtual');
      context.addFile(
        '.config/webpack/webpack.config.ts',
        `import { Configuration } from 'webpack';
export const config: Configuration = {
  externals: ['react', 'react-dom'],
};`
      );

      const modifier: ExternalsArrayModifier = (array) => {
        array.elements.push(recast.types.builders.literal('i18next'));
        return true;
      };

      const result = updateExternalsArray(context, modifier);

      expect(result).toBe(true);
      const content = context.getFile('.config/webpack/webpack.config.ts') || '';
      expect(content).toMatch(/['"]i18next['"]/);
      expect(content).toContain("'react'");
      expect(content).toContain("'react-dom'");
    });

    it('should prefer externals.ts over webpack.config.ts', () => {
      const context = new Context('/virtual');
      context.addFile('.config/bundler/externals.ts', `export const externals = ['react'];`);
      context.addFile('.config/webpack/webpack.config.ts', `export const config = { externals: ['react-dom'] };`);

      const modifier: ExternalsArrayModifier = (array) => {
        array.elements.push(recast.types.builders.literal('i18next'));
        return true;
      };

      const result = updateExternalsArray(context, modifier);

      expect(result).toBe(true);
      // Should update externals.ts, not webpack.config.ts
      const externalsContent = context.getFile('.config/bundler/externals.ts') || '';
      expect(externalsContent).toMatch(/['"]i18next['"]/);

      const webpackContent = context.getFile('.config/webpack/webpack.config.ts') || '';
      expect(webpackContent).not.toMatch(/['"]i18next['"]/);
    });
  });
});

import { PLUGIN_TYPES } from '../../constants.js';
import { getTemplateFiles } from '../utils.templates.js';

describe('Utils / Templates', () => {
  describe('getTemplateFiles()', () => {
    test('should return with a list of files', () => {
      expect(getTemplateFiles(PLUGIN_TYPES.app).length).toBeGreaterThan(0);
    });

    test('should be possible to filter templates by a sub-folder', () => {
      const templateFiles = getTemplateFiles(PLUGIN_TYPES.app, '.config/types');

      // Should have found at least one file
      expect(templateFiles.length).toBeGreaterThan(0);

      // A file that should live in this sub-directory
      expect(templateFiles.find((t) => t.includes('bundler-rules.d.ts'))).not.toBeUndefined();

      // Something that should not be found in this sub-directory
      expect(templateFiles.find((t) => t.includes('Dockerfile'))).toBeUndefined();
    });

    test('should return an empty array when filtering by a non-existing sub-folder', () => {
      const templateFiles = getTemplateFiles(PLUGIN_TYPES.app, '.config/types/foo/bar/unknown');

      expect(Array.isArray(templateFiles)).toBe(true);
      expect(templateFiles.length).toBe(0);
    });

    test('should be possible to filter for multiple different files', () => {
      const templateFiles = getTemplateFiles(PLUGIN_TYPES.app, ['.prettierrc.js', 'jest.config.js', 'tsconfig.json']);

      expect(Array.isArray(templateFiles)).toBe(true);
      expect(templateFiles.length).toBe(3);
    });

    test('should be possible to filter for a single file', () => {
      const templateFiles = getTemplateFiles(PLUGIN_TYPES.app, '.config/types/bundler-rules.d.ts');

      expect(Array.isArray(templateFiles)).toBe(true);
      expect(templateFiles.length).toBe(1);
    });
  });
});

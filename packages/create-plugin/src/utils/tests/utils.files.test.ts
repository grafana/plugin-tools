import { PLUGIN_TYPES, TEMPLATE_PATHS } from '../../constants.js';
import { filterOutCommonFiles, isFile } from '../utils.files.js';

describe('Utils/Files', () => {
  describe('filterOutCommonFiles()', () => {
    test('should remove common template files from the list that have a plugin-specific override', () => {
      expect(
        filterOutCommonFiles(
          [
            // Common template files
            `${TEMPLATE_PATHS.common}/.config/eslint.config.mjs`,
            `${TEMPLATE_PATHS.common}/.config/.gitignore`,
            `${TEMPLATE_PATHS.common}/.config/package.json`,

            // Override of a common template file
            `${TEMPLATE_PATHS.app}/.config/package.json`,

            // Only exists in the plugin-type specific templates
            `${TEMPLATE_PATHS.app}/.config/README.md`,
          ],
          PLUGIN_TYPES.app
        )
      ).toEqual([
        `${TEMPLATE_PATHS.common}/.config/eslint.config.mjs`,
        `${TEMPLATE_PATHS.common}/.config/.gitignore`,
        `${TEMPLATE_PATHS.app}/.config/package.json`,
        `${TEMPLATE_PATHS.app}/.config/README.md`,
      ]);
    });
  });

  describe('isFile()', () => {
    test('should return TRUE if the path is pointing to a file', () => {
      expect(isFile(`${TEMPLATE_PATHS.common}/LICENSE`)).toBe(true);
    });

    test('should return FALSE if the path is pointing to a directory', () => {
      expect(isFile(TEMPLATE_PATHS.common)).toBe(false);
    });
  });
});

import { FIXTURES_PATH, TEMPLATE_PATHS } from '../../constants.js';
import { getPluginJson } from '../utils.plugin.js';

describe('Utils / Plugins', () => {
  describe('getPluginJson()', () => {
    test('should return the parsed plugin JSON if the file exits', () => {
      const srcDir = `${FIXTURES_PATH}/test-template/src`;
      const pluginJson = getPluginJson(srcDir);

      expect(pluginJson).toBeDefined();
      expect(pluginJson.type).toBe('app');
    });

    test('should throw an error if the plugin.json is not found', () => {
      const srcDir = `${TEMPLATE_PATHS.app}/src/unknown`;

      expect(() => {
        getPluginJson(srcDir);
      }).toThrow();
    });
  });
});

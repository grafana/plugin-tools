import { getPluginJson, validatePluginJson } from './pluginValidation.js';

describe('pluginValidation', () => {
  describe('plugin.json', () => {
    test('missing plugin.json file', () => {
      expect(() => getPluginJson(`${__dirname}/mocks/missing-plugin.json`)).toThrowError();
    });
  });

  describe('validatePluginJson', () => {
    test('missing "id" field in the plugin.json file', () => {
      expect(() => validatePluginJson({})).toThrow('Plugin id is missing in plugin.json');
    });
  });
});

import { assertRootUrlIsValid, getPluginJson, validatePluginJson } from './pluginValidation.js';

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

    test('missing "info" node in the plugin.json file', () => {
      expect(() => validatePluginJson({ id: 'grafana-test-app' })).toThrow(
        'Plugin info node is missing in plugin.json'
      );
    });

    test('missing "info.version" field in the plugin.json file', () => {
      expect(() => validatePluginJson({ id: 'grafana-test-app', info: {} })).toThrow(
        'Plugin info.version is missing in plugin.json'
      );
    });

    test('invalid plugin type', () => {
      expect(() =>
        validatePluginJson({ id: 'grafana-test-app', info: { version: '1.0.0' }, type: 'renderer' })
      ).toThrow('Invalid plugin type in plugin.json: renderer');
    });

    test('plugin id not ending with the plugin type', () => {
      expect(() =>
        validatePluginJson({ id: 'grafana-test-datasource', info: { version: '1.0.0' }, type: 'app' })
      ).toThrow('[plugin.json] id should end with: -app');
    });

    test.each(['app', 'datasource', 'panel'])('valid plugin.json with type %s', (type) => {
      expect(() => validatePluginJson({ id: `grafana-test-${type}`, info: { version: '1.0.0' }, type })).not.toThrow();
    });
  });

  describe('assertRootUrlIsValid', () => {
    test('valid root URL', () => {
      expect(() => assertRootUrlIsValid('https://example.com/grafana')).not.toThrow();
    });

    test('invalid root URL', () => {
      expect(() => assertRootUrlIsValid('not-a-valid-url')).toThrow('not-a-valid-url is not a valid URL');
    });
  });
});

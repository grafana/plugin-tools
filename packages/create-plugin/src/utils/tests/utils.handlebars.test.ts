import { PLUGIN_TYPES } from '../../constants.js';
import { kebabToPascalKebab, normalizeId } from '../utils.handlebars.js';

describe('Handlebars helpers', () => {
  describe('normalize id', () => {
    test.each([PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel])(
      'should return the id with the type appended',
      (type: PLUGIN_TYPES) => {
        const pluginName = 'my-plugin';
        const orgName = 'my-org';
        const actual = normalizeId(pluginName, orgName, type);
        expect(actual).toEqual(`myorg-myplugin-${type}`);
      }
    );
    test.each([PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel])(
      'should not duplicate the type if it is already present',
      (type: PLUGIN_TYPES) => {
        const pluginName = `my-plugin-${type}`;
        const orgName = 'my-org';
        const actual = normalizeId(pluginName, orgName, type);
        expect(actual).toEqual(`myorg-myplugin-${type}`);
      }
    );

    test.each([PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel])(
      'should not duplicate the type if it is already present (no dash before type)',
      (type: PLUGIN_TYPES) => {
        const pluginName = `my-plugin${type}`;
        const orgName = 'my-org';
        const actual = normalizeId(pluginName, orgName, type);
        expect(actual).toEqual(`myorg-myplugin-${type}`);
      }
    );

    test.each([PLUGIN_TYPES.app, PLUGIN_TYPES.datasource, PLUGIN_TYPES.panel])(
      'should handle uppercase characters',
      (type: PLUGIN_TYPES) => {
        const pluginName = `MyPlugin`;
        const orgName = 'MyOrg';
        const actual = normalizeId(pluginName, orgName, type);
        expect(actual).toEqual(`myorg-myplugin-${type}`);
      }
    );
  });

  describe('pascal to pascal kebab', () => {
    test('should convert pascal case to pascal kebab case', () => {
      const actual = kebabToPascalKebab('my-plugin');
      expect(actual).toEqual('My-Plugin');
    });
  });
});

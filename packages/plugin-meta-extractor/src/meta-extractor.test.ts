import { extractPluginExtensions } from './meta-extractor';
import { PluginExtensionTypes } from './types';

const fixturesPath = `${__dirname}/../fixtures`;
const defaultExportFixtures = `${fixturesPath}/defaultExport`;
const namedExportFixtures = `${fixturesPath}/namedExport`;

describe('When app is exported as a NAMED-EXPORT', () => {
  describe('and extensions registered by chaining function calls', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${namedExportFixtures}/chained.tsx`;
      const extensionPoints = extractPluginExtensions(entry);

      expect(extensionPoints).toHaveLength(4);
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.component,
        extensionPointId: 'grafana/commandpalette/action',
        title: 'Component title 1',
        description: 'Component description 1',
      });
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.link,
        extensionPointId: 'grafana/dashboard/panel/menu',
        title: 'Link title 1',
        description: 'Link description 1',
      });
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.component,
        extensionPointId: 'grafana/dashboard/panel/menu',
        title: 'Component title 2',
        description: 'Component description 2',
      });
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.link,
        extensionPointId: 'grafana/commandpalette/action',
        title: 'Link title 2',
        description: 'Link description 2',
      });
    });
  });
});

describe('When app is exported as a DEFAULT-EXPORT', () => {
  describe('and extensions registered by chaining function calls', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${defaultExportFixtures}/chained.tsx`;
      const extensionPoints = extractPluginExtensions(entry);

      expect(extensionPoints).toHaveLength(4);
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.component,
        extensionPointId: 'grafana/commandpalette/action',
        title: 'Component title 1',
        description: 'Component description 1',
      });
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.link,
        extensionPointId: 'grafana/dashboard/panel/menu',
        title: 'Link title 1',
        description: 'Link description 1',
      });
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.component,
        extensionPointId: 'grafana/dashboard/panel/menu',
        title: 'Component title 2',
        description: 'Component description 2',
      });
      expect(extensionPoints).toContainEqual({
        type: PluginExtensionTypes.link,
        extensionPointId: 'grafana/commandpalette/action',
        title: 'Link title 2',
        description: 'Link description 2',
      });
    });
  });
});

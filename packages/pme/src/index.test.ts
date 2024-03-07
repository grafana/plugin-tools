import { createProgram } from '.';
import { MetaBase, MetaKind } from './meta/base';
import { ExtensionComponentMeta, ExtensionLinkMeta } from './meta/extensions';

const fixturesPath = `${__dirname}/../fixtures`;

describe('plugin meta extractor when app is exported as named export', () => {
  const fixtureFolder = 'namedExport';

  describe('and extensions registered by chaining function calls', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${fixturesPath}/${fixtureFolder}/chained.tsx`;
      const meta = createProgram(entry);

      expect(meta).toEqual([
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        }),
      ]);
    });
  });

  describe('and extensions registered in external function', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${fixturesPath}/${fixtureFolder}/wrapped.ts`;
      const meta = createProgram(entry);

      expect(meta).toEqual([
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        }),
      ]);
    });
  });

  describe('and extensions registered by chaining function calls and in an external function', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${fixturesPath}/${fixtureFolder}/mixed.tsx`;
      const meta = createProgram(entry);

      expect(meta).toEqual([
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 0',
          description: 'Component description 0',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 0',
          description: 'Link description 0',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        }),
      ]);
    });
  });
});

describe('plugin meta extractor when app is exported as default export', () => {
  const fixtureFolder = 'defaultExport';

  describe('and extensions registered by chaining function calls', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${fixturesPath}/${fixtureFolder}/chained.tsx`;
      const meta = createProgram(entry);

      expect(meta).toEqual([
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        }),
      ]);
    });
  });

  describe('and extensions registered in external function', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${fixturesPath}/${fixtureFolder}/wrapped.ts`;
      const meta = createProgram(entry);

      expect(meta).toEqual([
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        }),
      ]);
    });
  });

  describe('and extensions registered by chaining function calls and in an external function', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${fixturesPath}/${fixtureFolder}/mixed.tsx`;
      const meta = createProgram(entry);

      expect(meta).toEqual([
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 0',
          description: 'Component description 0',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 0',
          description: 'Link description 0',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        }),
        createCommandExtensionMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        }),
        createLinkExtensionMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        }),
      ]);
    });
  });
});

function createLinkExtensionMeta(meta: Omit<ExtensionLinkMeta, 'kind'>): MetaBase {
  return {
    kind: MetaKind.extensionLink,
    ...meta,
  };
}

function createCommandExtensionMeta(meta: Omit<ExtensionComponentMeta, 'kind'>): MetaBase {
  return {
    kind: MetaKind.extensionComponent,
    ...meta,
  };
}

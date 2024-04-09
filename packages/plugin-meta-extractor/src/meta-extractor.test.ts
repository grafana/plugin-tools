import { PluginExtensionTypes } from '@grafana/data';
import { extractExtensionPoints } from './meta-extractor';
import { PluginExtensionLinkMeta, PluginExtensionComponentMeta } from './types';

const fixturesPath = `${__dirname}/../fixtures`;
const defaultExportFixtures = `${fixturesPath}/defaultExport`;
const namedExportFixtures = `${fixturesPath}/namedExport`;

describe('When app is exported as a NAMED-EXPORT', () => {
  describe('and extensions registered by chaining function calls', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${namedExportFixtures}/chained.tsx`;
      const extensionPoints = extractExtensionPoints(entry);

      expect(extensionPoints).toHaveLength(4);
      expect(extensionPoints).toContainEqual(
        createPluginExtensionComponentMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        })
      );
      expect(extensionPoints).toContainEqual(
        createPluginExtensionLinkMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        })
      );
      expect(extensionPoints).toContainEqual(
        createPluginExtensionComponentMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        })
      );
      expect(extensionPoints).toContainEqual(
        createPluginExtensionLinkMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        })
      );
    });
  });

  // describe('and extensions registered in external function', () => {
  //   it('should return expected meta from app plugin', () => {
  //     const entry = `${namedExportFixtures}/wrapped.ts`;
  //     const extensionPoints = extractExtensionPoints(entry);

  //     expect(extensionPoints).toHaveLength(4);

  //       expect(extensionPoints).toEqual([
  //         createPluginExtensionComponentMeta({
  //           extensionPointId: 'grafana/commandpalette/action',
  //           title: 'Component title 1',
  //           description: 'Component description 1',
  //         }),
  //         createPluginExtensionLinkMeta({
  //           extensionPointId: 'grafana/dashboard/panel/menu',
  //           title: 'Link title 1',
  //           description: 'Link description 1',
  //         }),
  //         createPluginExtensionComponentMeta({
  //           extensionPointId: 'grafana/dashboard/panel/menu',
  //           title: 'Component title 2',
  //           description: 'Component description 2',
  //         }),
  //         createPluginExtensionLinkMeta({
  //           extensionPointId: 'grafana/commandpalette/action',
  //           title: 'Link title 2',
  //           description: 'Link description 2',
  //         }),
  //       ]);
  //     });
  //   });
  // });
});

// describe('and extensions registered by chaining function calls and in an external function', () => {
//   it('should return expected meta from app plugin', () => {
//     const entry = `${namedExportFixtures}/mixed.tsx`;
//     const meta = extractPluginMeta(entry);

//     expect(meta).toEqual([
//       createPluginExtensionComponentMeta({
//         extensionPointId: 'grafana/commandpalette/action',
//         title: 'Component title 0',
//         description: 'Component description 0',
//       }),
//       createPluginExtensionLinkMeta({
//         extensionPointId: 'grafana/dashboard/panel/menu',
//         title: 'Link title 0',
//         description: 'Link description 0',
//       }),
//       createPluginExtensionComponentMeta({
//         extensionPointId: 'grafana/commandpalette/action',
//         title: 'Component title 1',
//         description: 'Component description 1',
//       }),
//       createPluginExtensionLinkMeta({
//         extensionPointId: 'grafana/dashboard/panel/menu',
//         title: 'Link title 1',
//         description: 'Link description 1',
//       }),
//       createPluginExtensionComponentMeta({
//         extensionPointId: 'grafana/dashboard/panel/menu',
//         title: 'Component title 2',
//         description: 'Component description 2',
//       }),
//       createPluginExtensionLinkMeta({
//         extensionPointId: 'grafana/commandpalette/action',
//         title: 'Link title 2',
//         description: 'Link description 2',
//       }),
//     ]);
//   });
// });
// });

describe('When app is exported as a DEFAULT-EXPORT', () => {
  describe('and extensions registered by chaining function calls', () => {
    it('should return expected meta from app plugin', () => {
      const entry = `${defaultExportFixtures}/chained.tsx`;
      const extensionPoints = extractExtensionPoints(entry);

      expect(extensionPoints).toHaveLength(4);
      expect(extensionPoints).toContainEqual(
        createPluginExtensionComponentMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Component title 1',
          description: 'Component description 1',
        })
      );
      expect(extensionPoints).toContainEqual(
        createPluginExtensionLinkMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Link title 1',
          description: 'Link description 1',
        })
      );
      expect(extensionPoints).toContainEqual(
        createPluginExtensionComponentMeta({
          extensionPointId: 'grafana/dashboard/panel/menu',
          title: 'Component title 2',
          description: 'Component description 2',
        })
      );
      expect(extensionPoints).toContainEqual(
        createPluginExtensionLinkMeta({
          extensionPointId: 'grafana/commandpalette/action',
          title: 'Link title 2',
          description: 'Link description 2',
        })
      );
    });
  });

  // describe('and extensions registered in external function', () => {
  //   it('should return expected meta from app plugin', () => {
  //     const entry = `${defaultExportFixtures}/wrapped.ts`;
  //     const meta = extractPluginMeta(entry);

  //     expect(meta).toEqual([
  //       createPluginExtensionComponentMeta({
  //         extensionPointId: 'grafana/commandpalette/action',
  //         title: 'Component title 1',
  //         description: 'Component description 1',
  //       }),
  //       createPluginExtensionLinkMeta({
  //         extensionPointId: 'grafana/dashboard/panel/menu',
  //         title: 'Link title 1',
  //         description: 'Link description 1',
  //       }),
  //       createPluginExtensionComponentMeta({
  //         extensionPointId: 'grafana/dashboard/panel/menu',
  //         title: 'Component title 2',
  //         description: 'Component description 2',
  //       }),
  //       createPluginExtensionLinkMeta({
  //         extensionPointId: 'grafana/commandpalette/action',
  //         title: 'Link title 2',
  //         description: 'Link description 2',
  //       }),
  //     ]);
  //   });
  // });

  // describe('and extensions registered by chaining function calls and in an external function', () => {
  //   it('should return expected meta from app plugin', () => {
  //     const entry = `${defaultExportFixtures}/mixed.tsx`;
  //     const meta = extractPluginMeta(entry);

  //     expect(meta).toEqual([
  //       createPluginExtensionComponentMeta({
  //         extensionPointId: 'grafana/commandpalette/action',
  //         title: 'Component title 0',
  //         description: 'Component description 0',
  //       }),
  //       createPluginExtensionLinkMeta({
  //         extensionPointId: 'grafana/dashboard/panel/menu',
  //         title: 'Link title 0',
  //         description: 'Link description 0',
  //       }),
  //       createPluginExtensionComponentMeta({
  //         extensionPointId: 'grafana/commandpalette/action',
  //         title: 'Component title 1',
  //         description: 'Component description 1',
  //       }),
  //       createPluginExtensionLinkMeta({
  //         extensionPointId: 'grafana/dashboard/panel/menu',
  //         title: 'Link title 1',
  //         description: 'Link description 1',
  //       }),
  //       createPluginExtensionComponentMeta({
  //         extensionPointId: 'grafana/dashboard/panel/menu',
  //         title: 'Component title 2',
  //         description: 'Component description 2',
  //       }),
  //       createPluginExtensionLinkMeta({
  //         extensionPointId: 'grafana/commandpalette/action',
  //         title: 'Link title 2',
  //         description: 'Link description 2',
  //       }),
  //     ]);
  //   });
  // });
});

function createPluginExtensionLinkMeta(meta: Omit<PluginExtensionLinkMeta, 'type'>): PluginExtensionLinkMeta {
  return {
    type: PluginExtensionTypes.link,
    ...meta,
  };
}

function createPluginExtensionComponentMeta(
  meta: Omit<PluginExtensionComponentMeta, 'type'>
): PluginExtensionComponentMeta {
  return {
    type: PluginExtensionTypes.component,
    ...meta,
  };
}

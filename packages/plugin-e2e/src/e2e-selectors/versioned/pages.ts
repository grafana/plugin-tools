import { MIN_GRAFANA_VERSION } from './constants';
import { verifySelector, verifySelectorWithArgs, verifySelectorGroup } from './utils';

const selectors = {
  Home: {
    url: verifySelector({
      [MIN_GRAFANA_VERSION]: () => '/',
    }),
  },
  DataSource: {
    saveAndTest: verifySelector({
      '10.0.0': () => 'data-testid Data source settings page Save and Test button',
      [MIN_GRAFANA_VERSION]: () => 'Data source settings page Save and Test button',
    }),
  },
  EditDataSource: {
    url: verifySelectorWithArgs<{ dataSourceUid: string }>({
      '10.2.0': (args) => `/connections/datasources/edit/${args.dataSourceUid}`,
      [MIN_GRAFANA_VERSION]: (args) => `/datasources/edit/${args.dataSourceUid}`,
    }),
  },
  AddDashboard: {
    url: verifySelector({
      [MIN_GRAFANA_VERSION]: () => '/dashboard/new',
    }),
    itemButton: verifySelectorWithArgs<{ title: string }>({
      //did not exist prior to 9.5.0
      '9.5.0': (args) => `data-testid ${args.title}`,
    }),
    addNewPanel: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'Add new panel',
    }),
    itemButtonAddViz: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'Add new visualization menu item',
    }),
    Settings: {
      Annotations: {
        List: {
          url: verifySelector({
            [MIN_GRAFANA_VERSION]: () => '/dashboard/new?orgId=1&editview=annotations',
          }),
        },
        Edit: {
          url: verifySelectorWithArgs<{ annotationIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/dashboard/new?editview=annotations&editIndex=${args.annotationIndex}`,
          }),
        },
      },
      Variables: {
        List: {
          url: verifySelector({
            [MIN_GRAFANA_VERSION]: () => '/dashboard/new?orgId=1&editview=templating',
          }),
        },
        Edit: {
          url: verifySelectorWithArgs<{ annotationIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) =>
              `/dashboard/new?orgId=1&editview=templating&editIndex=${args.annotationIndex}`,
          }),
        },
      },
    },
  },
  Dashboard: {
    url: verifySelectorWithArgs<{ uid: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/d/${args.uid}`,
    }),
    Settings: {
      Annotations: {
        Edit: {
          url: verifySelectorWithArgs<{ dashboardUid: string; annotationIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) =>
              `/d/${args.dashboardUid}?editview=annotations&editIndex=${args.annotationIndex}`,
          }),
        },
        List: {
          url: verifySelectorWithArgs<{ dashboardUid: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/d/${args.dashboardUid}?editview=annotations`,
          }),
          addAnnotationCTA: verifySelector({
            [MIN_GRAFANA_VERSION]: () => 'Call to action button Add annotation query',
          }),
          addAnnotationCTAV2: verifySelector({
            //did not exist prior to 8.3.0
            '8.3.0': () => 'data-testid Call to action button Add annotation query',
          }),
        },
      },
      Variables: {
        List: {
          url: verifySelectorWithArgs<{ dashboardUid: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/d/${args.dashboardUid}?editview=templating`,
          }),
          newButton: verifySelector({
            [MIN_GRAFANA_VERSION]: () => 'Variable editor New variable button',
          }),
          table: verifySelector({
            [MIN_GRAFANA_VERSION]: () => 'Variable editor Table',
          }),
          addVariableCTAV2: verifySelectorWithArgs<{ name: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `data-testid Call to action button ${args.name}`,
          }),
          addVariableCTAV2Item: verifySelector({
            [MIN_GRAFANA_VERSION]: () => 'Add variable',
          }),
        },
        Edit: {
          url: verifySelectorWithArgs<{ dashboardUid: string; editIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/d/${args.dashboardUid}?editview=templating&editIndex=${args.editIndex}`,
          }),
          General: {
            generalTypeSelectV2: verifySelector({
              '8.5.0': () => 'data-testid Variable editor Form Type select',
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Form Type select',
            }),
            previewOfValuesOption: verifySelector({
              '10.4.0': () => 'data-testid Variable editor Preview of Values option',
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Preview of Values option',
            }),
            submitButton: verifySelector({
              '10.4.0': () => 'data-testid Variable editor Run Query button',
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Submit button',
            }),
            selectionOptionsIncludeAllSwitch: verifySelector({
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Form IncludeAll switch',
            }),
          },
        },
      },
    },
  },
  Explore: {
    url: verifySelector({
      [MIN_GRAFANA_VERSION]: () => '/explore',
    }),
  },
  Plugin: {
    url: verifySelectorWithArgs<{ pluginId: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/plugins/${args.pluginId}`,
    }),
  },
};

export type VersionedPages = typeof selectors;
export const versionedPages = verifySelectorGroup<VersionedPages>(selectors);

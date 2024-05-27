import { MIN_GRAFANA_VERSION } from './constants';
import { createSelector, createSelectorWithArgs } from './factory';

export const versionedPages = {
  Home: {
    url: createSelector({
      [MIN_GRAFANA_VERSION]: () => '/',
    }),
  },
  DataSource: {
    saveAndTest: createSelector({
      '10.0.0': () => 'data-testid Data source settings page Save and Test button',
      [MIN_GRAFANA_VERSION]: () => 'Data source settings page Save and Test button',
    }),
  },
  EditDataSource: {
    url: createSelectorWithArgs<{ dataSourceUid: string }>({
      '10.2.0': (args) => `/connections/datasources/edit/${args.dataSourceUid}`,
      [MIN_GRAFANA_VERSION]: (args) => `/datasources/edit/${args.dataSourceUid}`,
    }),
  },
  AddDashboard: {
    url: createSelector({
      [MIN_GRAFANA_VERSION]: () => '/dashboard/new',
    }),
    itemButton: createSelectorWithArgs<{ title: string }>({
      //did not exist prior to 9.5.0
      '9.5.0': (args) => `data-testid ${args.title}`,
    }),
    addNewPanel: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'Add new panel',
    }),
    itemButtonAddViz: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'Add new visualization menu item',
    }),
    Settings: {
      Annotations: {
        List: {
          url: createSelector({
            [MIN_GRAFANA_VERSION]: () => '/dashboard/new?orgId=1&editview=annotations',
          }),
        },
        Edit: {
          url: createSelectorWithArgs<{ annotationIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/dashboard/new?editview=annotations&editIndex=${args.annotationIndex}`,
          }),
        },
      },
      Variables: {
        List: {
          url: createSelector({
            [MIN_GRAFANA_VERSION]: () => '/dashboard/new?orgId=1&editview=templating',
          }),
        },
        Edit: {
          url: createSelectorWithArgs<{ annotationIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) =>
              `/dashboard/new?orgId=1&editview=templating&editIndex=${args.annotationIndex}`,
          }),
        },
      },
    },
  },
  Dashboard: {
    url: createSelectorWithArgs<{ uid: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/d/${args.uid}`,
    }),
    Settings: {
      Annotations: {
        Edit: {
          url: createSelectorWithArgs<{ dashboardUid: string; annotationIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) =>
              `/d/${args.dashboardUid}?editview=annotations&editIndex=${args.annotationIndex}`,
          }),
        },
        List: {
          url: createSelectorWithArgs<{ dashboardUid: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/d/${args.dashboardUid}?editview=annotations`,
          }),
          addAnnotationCTA: createSelector({
            [MIN_GRAFANA_VERSION]: () => 'Call to action button Add annotation query',
          }),
          addAnnotationCTAV2: createSelector({
            //did not exist prior to 8.3.0
            '8.3.0': () => 'data-testid Call to action button Add annotation query',
          }),
        },
      },
      Variables: {
        List: {
          url: createSelectorWithArgs<{ dashboardUid: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/d/${args.dashboardUid}?editview=templating`,
          }),
          newButton: createSelector({
            [MIN_GRAFANA_VERSION]: () => 'Variable editor New variable button',
          }),
          table: createSelector({
            [MIN_GRAFANA_VERSION]: () => 'Variable editor Table',
          }),
          addVariableCTAV2: createSelectorWithArgs<{ name: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `data-testid Call to action button ${args.name}`,
          }),
          addVariableCTAV2Item: createSelector({
            [MIN_GRAFANA_VERSION]: () => 'Add variable',
          }),
        },
        Edit: {
          url: createSelectorWithArgs<{ dashboardUid: string; editIndex: string }>({
            [MIN_GRAFANA_VERSION]: (args) => `/d/${args.dashboardUid}?editview=templating&editIndex=${args.editIndex}`,
          }),
          General: {
            generalTypeSelectV2: createSelector({
              '8.5.0': () => 'data-testid Variable editor Form Type select',
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Form Type select',
            }),
            previewOfValuesOption: createSelector({
              '10.4.0': () => 'data-testid Variable editor Preview of Values option',
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Preview of Values option',
            }),
            submitButton: createSelector({
              '10.4.0': () => 'data-testid Variable editor Run Query button',
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Submit button',
            }),
            selectionOptionsIncludeAllSwitch: createSelector({
              [MIN_GRAFANA_VERSION]: () => 'Variable editor Form IncludeAll switch',
            }),
          },
        },
      },
    },
  },
  Explore: {
    url: createSelector({
      [MIN_GRAFANA_VERSION]: () => '/explore',
    }),
  },
  Plugin: {
    url: createSelectorWithArgs<{ pluginId: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `/plugins/${args.pluginId}`,
    }),
  },
};

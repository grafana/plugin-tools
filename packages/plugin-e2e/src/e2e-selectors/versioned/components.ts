import { MIN_GRAFANA_VERSION } from './constants';
import { createSelector, createSelectorWithArgs } from './factory';

export const versionedComponents = {
  TimePicker: {
    openButton: createSelector({
      '8.1.0': () => 'data-testid TimePicker Open Button',
      [MIN_GRAFANA_VERSION]: () => 'TimePicker open button',
    }),
    fromField: createSelector({
      '10.2.3': () => 'data-testid Time Range from field',
      [MIN_GRAFANA_VERSION]: () => 'Time Range from field',
    }),
    toField: createSelector({
      '10.2.3': () => 'data-testid Time Range to field',
      [MIN_GRAFANA_VERSION]: () => 'Time Range to field',
    }),
    applyTimeRange: createSelector({
      '8.1.0': () => 'data-testid TimePicker submit button',
      [MIN_GRAFANA_VERSION]: () => 'TimePicker submit button',
    }),
    absoluteTimeRangeTitle: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'data-testid-absolute-time-range-narrow',
    }),
  },
  Menu: {
    MenuComponent: createSelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.title} menu`,
    }),
    MenuGroup: createSelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.title} menu group`,
    }),
    MenuItem: createSelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.title} menu item`,
    }),
    SubMenu: {
      container: createSelector({
        '10.3.0': () => 'data-testid SubMenu container',
        [MIN_GRAFANA_VERSION]: () => 'SubMenu',
      }),
      icon: createSelector({
        '10.3.0': () => 'data-testid SubMenu icon',
        [MIN_GRAFANA_VERSION]: () => 'SubMenu icon',
      }),
    },
  },
  Panels: {
    Panel: {
      title: createSelectorWithArgs<{ title: string }>({
        '8.1.2': (args) => `data-testid Panel header ${args.title}`,
        [MIN_GRAFANA_VERSION]: (args) => `Panel header ${args.title}`,
      }),
      headerCornerInfo: createSelectorWithArgs<{ mode: string }>({
        [MIN_GRAFANA_VERSION]: (args) => `Panel header ${args.mode}`,
      }),
      status: createSelectorWithArgs<{ status: string }>({
        ['10.2.0']: (args) => `data-testid Panel status ${args.status}`,
        [MIN_GRAFANA_VERSION]: () => 'Panel status',
      }),
      toggleTableViewPanel: createSelectorWithArgs<{ title: string }>({
        '10.4.0': (args) => `data-testid Panel header ${args.title}`,
        [MIN_GRAFANA_VERSION]: () => 'data-testid Panel',
      }),
      PanelDataErrorMessage: createSelector({
        '10.4.0': () => 'data-testid Panel data error message',
      }),
      menuItems: createSelectorWithArgs<{ item: string }>({
        '9.5.0': (args) => `data-testid Panel menu item ${args.item}`,
      }),
      menu: createSelectorWithArgs<{ item: string }>({
        '9.5.0': (args) => `data-testid Panel menu ${args.item}`,
      }),
    },
    Visualization: {
      Table: {
        header: createSelector({
          [MIN_GRAFANA_VERSION]: () => 'table header',
        }),
        footer: createSelector({
          [MIN_GRAFANA_VERSION]: () => 'table-footer',
        }),
        body: createSelector({
          // did not exist prior to 10.2.0
          '10.2.0': () => 'data-testid table body',
        }),
      },
    },
  },
  VizLegend: {
    seriesName: createSelectorWithArgs<{ name: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `VizLegend series ${args.name}`,
    }),
  },
  Drawer: {
    General: {
      title: createSelectorWithArgs<{ title: string }>({
        [MIN_GRAFANA_VERSION]: (args) => `Drawer title ${args.title}`,
      }),
    },
  },
  PanelEditor: {
    General: {
      content: createSelector({
        '11.1.0': () => 'data-testid Panel editor content',
        [MIN_GRAFANA_VERSION]: () => 'Panel editor content',
      }),
    },
    applyButton: createSelector({
      '9.2.0': () => 'data-testid Apply changes and go back to dashboard',
      [MIN_GRAFANA_VERSION]: () => 'Apply changes and go back to dashboard',
    }),
    toggleVizPicker: createSelector({
      '10.0.0': () => 'data-testid toggle-viz-picker',
      [MIN_GRAFANA_VERSION]: () => 'toggle-viz-picker',
    }),
    OptionsPane: {
      content: createSelector({
        '11.1.0': () => 'data-testid Panel editor option pane content',
        [MIN_GRAFANA_VERSION]: () => 'Panel editor option pane content',
      }),
      fieldLabel: createSelectorWithArgs<{ type: string }>({
        [MIN_GRAFANA_VERSION]: (args) => `${args.type} field property editor`,
      }),
      fieldInput: createSelectorWithArgs<{ title: string }>({
        '11.0.0': (args) => `data-testid Panel editor option pane field input ${args.title}`,
      }),
    },
  },
  RefreshPicker: {
    runButtonV2: createSelector({
      ['8.3.0']: () => 'data-testid RefreshPicker run button',
      [MIN_GRAFANA_VERSION]: () => 'RefreshPicker run button',
    }),
  },
  QueryEditorRows: {
    rows: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'Query editor row',
    }),
  },
  QueryEditorRow: {
    title: createSelectorWithArgs<{ refId: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `Query editor row title ${args.refId}`,
    }),
  },
  Alert: {
    alertV2: createSelectorWithArgs<{ severity: string }>({
      '8.3.0': (args) => `data-testid Alert ${args.severity}`,
      [MIN_GRAFANA_VERSION]: (args) => `Alert ${args.severity}`,
    }),
  },
  PageToolbar: {
    item: createSelectorWithArgs<{ tooltip: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.tooltip}`,
    }),
    shotMoreItems: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'Show more items',
    }),
    itemButton: createSelectorWithArgs<{ title: string }>({
      //did not exist prior to 9.5.0
      ['9.5.0']: (args) => `data-testid ${args.title}`,
    }),
    itemButtonTitle: createSelector({
      '10.1.0': () => 'Add button',
      [MIN_GRAFANA_VERSION]: () => 'Add panel button',
    }),
  },
  QueryEditorToolbarItem: {
    button: createSelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `QueryEditor toolbar item button ${args.title}`,
    }),
  },
  OptionsGroup: {
    group: createSelectorWithArgs<{ title?: string }>({
      '11.1.0': (args) => (args.title ? `data-testid Options group ${args.title}` : 'data-testid Options group'),
      [MIN_GRAFANA_VERSION]: (args) => (args.title ? `Options group ${args.title}` : 'Options group'),
    }),
    toggle: createSelectorWithArgs<{ title?: string }>({
      '11.1.0': (args) =>
        args.title ? `data-testid Options group ${args.title} toggle` : 'data-testid Options group toggle',
      [MIN_GRAFANA_VERSION]: (args) => (args.title ? `Options group ${args.title} toggle` : 'Options group toggle'),
    }),
    groupTitle: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'Panel options',
    }),
  },
  PluginVisualization: {
    item: createSelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `Plugin visualization item ${args.title}`,
    }),
  },
  Select: {
    option: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'Select option',
    }),
    input: createSelector({
      '8.3.0': () => 'input[id*="time-options-input"]',
      [MIN_GRAFANA_VERSION]: () => 'input[id*="react-select-"]',
    }),
    singleValue: createSelector({
      [MIN_GRAFANA_VERSION]: () => 'div[class*="-singleValue"]',
    }),
  },
  DataSourcePicker: {
    container: createSelector({
      '10.0.0': () => 'data-testid Data source picker select container',
      // did not exist prior to 8.3.0
      '8.3.0': () => 'Data source picker select container',
    }),
  },
  TimeZonePicker: {
    containerV2: createSelector({
      '8.3.0': () => 'data-testid Time zone picker select container',
      [MIN_GRAFANA_VERSION]: () => 'Folder picker select container',
    }),
    changeTimeSettingsButton: createSelector({
      '11.0.0': () => 'data-testid Time zone picker Change time settings button',
    }),
  },
  CodeEditor: {
    container: createSelector({
      '10.2.3': () => 'data-testid Code editor container',
      [MIN_GRAFANA_VERSION]: () => 'Code editor container',
    }),
  },
  Annotations: {
    editor: {
      testButton: createSelector({
        '11.0.0': () => 'data-testid annotations-test-button',
      }),
      resultContainer: createSelector({
        '11.0.0': () => 'data-testid annotations-query-result-container',
      }),
    },
  },
  QueryField: {
    container: createSelector({
      '10.3.0': () => 'data-testid Query field',
      [MIN_GRAFANA_VERSION]: () => 'Query field',
    }),
  },
};

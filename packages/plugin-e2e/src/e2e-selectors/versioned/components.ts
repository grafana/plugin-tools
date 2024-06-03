import { MIN_GRAFANA_VERSION } from './constants';
import { verifySelector, verifySelectorWithArgs, verifySelectors } from './utils';

const selectors = {
  TimePicker: {
    openButton: verifySelector({
      '8.1.0': () => 'data-testid TimePicker Open Button',
      [MIN_GRAFANA_VERSION]: () => 'TimePicker open button',
    }),
    fromField: verifySelector({
      '10.2.3': () => 'data-testid Time Range from field',
      [MIN_GRAFANA_VERSION]: () => 'Time Range from field',
      '': () => ``,
    }),
    toField: verifySelector({
      '10.2.3': () => 'data-testid Time Range to field',
      [MIN_GRAFANA_VERSION]: () => 'Time Range to field',
    }),
    applyTimeRange: verifySelector({
      '8.1.0': () => 'data-testid TimePicker submit button',
      [MIN_GRAFANA_VERSION]: () => 'TimePicker submit button',
    }),
    absoluteTimeRangeTitle: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'data-testid-absolute-time-range-narrow',
    }),
  },
  Menu: {
    MenuComponent: verifySelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.title} menu`,
    }),
    MenuGroup: verifySelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.title} menu group`,
    }),
    MenuItem: verifySelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.title} menu item`,
    }),
    SubMenu: {
      container: verifySelector({
        '10.3.0': () => 'data-testid SubMenu container',
        [MIN_GRAFANA_VERSION]: () => 'SubMenu',
      }),
      icon: verifySelector({
        '10.3.0': () => 'data-testid SubMenu icon',
        [MIN_GRAFANA_VERSION]: () => 'SubMenu icon',
      }),
    },
  },
  Panels: {
    Panel: {
      title: verifySelectorWithArgs<{ title: string }>({
        '8.1.2': (args) => `data-testid Panel header ${args.title}`,
        [MIN_GRAFANA_VERSION]: (args) => `Panel header ${args.title}`,
      }),
      headerCornerInfo: verifySelectorWithArgs<{ mode: string }>({
        [MIN_GRAFANA_VERSION]: (args) => `Panel header ${args.mode}`,
      }),
      status: verifySelectorWithArgs<{ status: string }>({
        ['10.2.0']: (args) => `data-testid Panel status ${args.status}`,
        [MIN_GRAFANA_VERSION]: () => 'Panel status',
      }),
      toggleTableViewPanel: verifySelectorWithArgs<{ title: string }>({
        '10.4.0': (args) => `data-testid Panel header ${args.title}`,
        [MIN_GRAFANA_VERSION]: () => 'data-testid Panel',
      }),
      PanelDataErrorMessage: verifySelector({
        '10.4.0': () => 'data-testid Panel data error message',
      }),
      menuItems: verifySelectorWithArgs<{ item: string }>({
        '9.5.0': (args) => `data-testid Panel menu item ${args.item}`,
      }),
      menu: verifySelectorWithArgs<{ item: string }>({
        '9.5.0': (args) => `data-testid Panel menu ${args.item}`,
      }),
    },
    Visualization: {
      Table: {
        header: verifySelector({
          [MIN_GRAFANA_VERSION]: () => 'table header',
        }),
        footer: verifySelector({
          [MIN_GRAFANA_VERSION]: () => 'table-footer',
        }),
        body: verifySelector({
          // did not exist prior to 10.2.0
          '10.2.0': () => 'data-testid table body',
        }),
      },
    },
  },
  VizLegend: {
    seriesName: verifySelectorWithArgs<{ name: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `VizLegend series ${args.name}`,
    }),
  },
  Drawer: {
    General: {
      title: verifySelectorWithArgs<{ title: string }>({
        [MIN_GRAFANA_VERSION]: (args) => `Drawer title ${args.title}`,
      }),
    },
  },
  PanelEditor: {
    General: {
      content: verifySelector({
        '11.1.0': () => 'data-testid Panel editor content',
        [MIN_GRAFANA_VERSION]: () => 'Panel editor content',
      }),
    },
    applyButton: verifySelector({
      '9.2.0': () => 'data-testid Apply changes and go back to dashboard',
      [MIN_GRAFANA_VERSION]: () => 'Apply changes and go back to dashboard',
    }),
    toggleVizPicker: verifySelector({
      '10.0.0': () => 'data-testid toggle-viz-picker',
      [MIN_GRAFANA_VERSION]: () => 'toggle-viz-picker',
    }),
    OptionsPane: {
      content: verifySelector({
        '11.1.0': () => 'data-testid Panel editor option pane content',
        [MIN_GRAFANA_VERSION]: () => 'Panel editor option pane content',
      }),
      fieldLabel: verifySelectorWithArgs<{ type: string }>({
        [MIN_GRAFANA_VERSION]: (args) => `${args.type} field property editor`,
      }),
      fieldInput: verifySelectorWithArgs<{ title: string }>({
        '11.0.0': (args) => `data-testid Panel editor option pane field input ${args.title}`,
      }),
    },
  },
  RefreshPicker: {
    runButtonV2: verifySelector({
      ['8.3.0']: () => 'data-testid RefreshPicker run button',
      [MIN_GRAFANA_VERSION]: () => 'RefreshPicker run button',
    }),
  },
  QueryEditorRows: {
    rows: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'Query editor row',
    }),
  },
  QueryEditorRow: {
    title: verifySelectorWithArgs<{ refId: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `Query editor row title ${args.refId}`,
    }),
  },
  Alert: {
    alertV2: verifySelectorWithArgs<{ severity: string }>({
      '8.3.0': (args) => `data-testid Alert ${args.severity}`,
      [MIN_GRAFANA_VERSION]: (args) => `Alert ${args.severity}`,
    }),
  },
  PageToolbar: {
    item: verifySelectorWithArgs<{ tooltip: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `${args.tooltip}`,
    }),
    shotMoreItems: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'Show more items',
    }),
    itemButton: verifySelectorWithArgs<{ title: string }>({
      //did not exist prior to 9.5.0
      ['9.5.0']: (args) => `data-testid ${args.title}`,
    }),
    itemButtonTitle: verifySelector({
      '10.1.0': () => 'Add button',
      [MIN_GRAFANA_VERSION]: () => 'Add panel button',
    }),
  },
  QueryEditorToolbarItem: {
    button: verifySelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `QueryEditor toolbar item button ${args.title}`,
    }),
  },
  OptionsGroup: {
    group: verifySelectorWithArgs<{ title?: string }>({
      '11.1.0': (args) => (args.title ? `data-testid Options group ${args.title}` : 'data-testid Options group'),
      [MIN_GRAFANA_VERSION]: (args) => (args.title ? `Options group ${args.title}` : 'Options group'),
    }),
    toggle: verifySelectorWithArgs<{ title?: string }>({
      '11.1.0': (args) =>
        args.title ? `data-testid Options group ${args.title} toggle` : 'data-testid Options group toggle',
      [MIN_GRAFANA_VERSION]: (args) => (args.title ? `Options group ${args.title} toggle` : 'Options group toggle'),
    }),
    groupTitle: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'Panel options',
    }),
  },
  PluginVisualization: {
    item: verifySelectorWithArgs<{ title: string }>({
      [MIN_GRAFANA_VERSION]: (args) => `Plugin visualization item ${args.title}`,
    }),
  },
  Select: {
    option: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'Select option',
    }),
    input: verifySelector({
      '8.3.0': () => 'input[id*="time-options-input"]',
      [MIN_GRAFANA_VERSION]: () => 'input[id*="react-select-"]',
    }),
    singleValue: verifySelector({
      [MIN_GRAFANA_VERSION]: () => 'div[class*="-singleValue"]',
    }),
  },
  DataSourcePicker: {
    container: verifySelector({
      '10.0.0': () => 'data-testid Data source picker select container',
      // did not exist prior to 8.3.0
      '8.3.0': () => 'Data source picker select container',
    }),
  },
  TimeZonePicker: {
    containerV2: verifySelector({
      '8.3.0': () => 'data-testid Time zone picker select container',
      [MIN_GRAFANA_VERSION]: () => 'Folder picker select container',
    }),
    changeTimeSettingsButton: verifySelector({
      '11.0.0': () => 'data-testid Time zone picker Change time settings button',
    }),
  },
  CodeEditor: {
    container: verifySelector({
      '10.2.3': () => 'data-testid Code editor container',
      [MIN_GRAFANA_VERSION]: () => 'Code editor container',
    }),
  },
  Annotations: {
    editor: {
      testButton: verifySelector({
        '11.0.0': () => 'data-testid annotations-test-button',
      }),
      resultContainer: verifySelector({
        '11.0.0': () => 'data-testid annotations-query-result-container',
      }),
    },
  },
  QueryField: {
    container: verifySelector({
      '10.3.0': () => 'data-testid Query field',
      [MIN_GRAFANA_VERSION]: () => 'Query field',
    }),
  },
};

export type VersionedComponents = typeof selectors;
export const versionedComponents = verifySelectors<VersionedComponents>(selectors);

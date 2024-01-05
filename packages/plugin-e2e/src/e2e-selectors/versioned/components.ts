import { MIN_GRAFANA_VERSION } from './constants';

export const versionedComponents = {
  TimePicker: {
    openButton: {
      '8.1.0': 'data-testid TimePicker Open Button',
      [MIN_GRAFANA_VERSION]: 'TimePicker open button',
    },
    fromField: {
      '10.2.3': 'data-testid Time Range from field',
      [MIN_GRAFANA_VERSION]: 'Time Range from field',
    },
    toField: {
      '10.2.3': 'data-testid Time Range to field',
      [MIN_GRAFANA_VERSION]: 'Time Range to field',
    },
    applyTimeRange: {
      '8.1.0': 'data-testid TimePicker submit button',
      [MIN_GRAFANA_VERSION]: 'TimePicker submit button',
    },
    absoluteTimeRangeTitle: {
      [MIN_GRAFANA_VERSION]: 'data-testid-absolute-time-range-narrow',
    },
  },
  Panels: {
    Panel: {
      title: {
        '8.1.2': (title: string) => `data-testid Panel header ${title}`,
        [MIN_GRAFANA_VERSION]: (title: string) => `Panel header ${title}`,
      },
      headerCornerInfo: {
        [MIN_GRAFANA_VERSION]: (mode: string) => `Panel header ${mode}`,
      },
      status: {
        ['10.2.0']: (status: string) => `data-testid Panel status ${status}`,
        [MIN_GRAFANA_VERSION]: (_: string) => 'Panel status',
      },
    },
    Visualization: {
      Table: {
        header: {
          [MIN_GRAFANA_VERSION]: 'table header',
        },
        footer: {
          [MIN_GRAFANA_VERSION]: 'table-footer',
        },
        body: {
          // did not exist prior to 10.2.0
          '10.2.0': 'data-testid table body',
        },
      },
    },
  },
  PanelEditor: {
    General: {
      content: {
        [MIN_GRAFANA_VERSION]: 'Panel editor content',
      },
    },
    applyButton: {
      '9.2.0': 'data-testid Apply changes and go back to dashboard',
      [MIN_GRAFANA_VERSION]: 'Apply changes and go back to dashboard',
    },
    toggleVizPicker: {
      '10.0.0': 'data-testid toggle-viz-picker',
      [MIN_GRAFANA_VERSION]: 'toggle-viz-picker',
    },
  },
  RefreshPicker: {
    runButtonV2: {
      ['8.3.0']: 'data-testid RefreshPicker run button',
      [MIN_GRAFANA_VERSION]: 'RefreshPicker run button',
    },
  },
  QueryEditorRows: {
    rows: {
      [MIN_GRAFANA_VERSION]: 'Query editor row',
    },
  },
  QueryEditorRow: {
    title: {
      [MIN_GRAFANA_VERSION]: (refId: string) => `Query editor row title ${refId}`,
    },
  },
  Alert: {
    alertV2: {
      '8.3.0': (severity: string) => `data-testid Alert ${severity}`,
      [MIN_GRAFANA_VERSION]: (severity: string) => `Alert ${severity}`,
    },
  },
  PageToolbar: {
    item: {
      [MIN_GRAFANA_VERSION]: (tooltip: string) => `${tooltip}`,
    },
    shotMoreItems: {
      [MIN_GRAFANA_VERSION]: 'Show more items',
    },
    itemButton: {
      //did not exist prior to 9.5.0
      ['9.5.0']: (title: string) => `data-testid ${title}`,
    },
    itemButtonTitle: {
      '10.1.0': 'Add button',
      [MIN_GRAFANA_VERSION]: 'Add panel button',
    },
  },
  QueryEditorToolbarItem: {
    button: {
      [MIN_GRAFANA_VERSION]: (title: string) => `QueryEditor toolbar item button ${title}`,
    },
  },
  OptionsGroup: {
    group: {
      [MIN_GRAFANA_VERSION]: (title?: string) => (title ? `Options group ${title}` : 'Options group'),
    },
    toggle: {
      [MIN_GRAFANA_VERSION]: (title?: string) => (title ? `Options group ${title} toggle` : 'Options group toggle'),
    },
    groupTitle: {
      [MIN_GRAFANA_VERSION]: 'Panel options',
    },
  },
  PluginVisualization: {
    item: {
      [MIN_GRAFANA_VERSION]: (title: string) => `Plugin visualization item ${title}`,
    },
  },
  Select: {
    option: {
      [MIN_GRAFANA_VERSION]: 'Select option',
    },
    input: {
      '8.3.0': () => 'input[id*="time-options-input"]',
      [MIN_GRAFANA_VERSION]: () => 'input[id*="react-select-"]',
    },
    singleValue: {
      [MIN_GRAFANA_VERSION]: () => 'div[class*="-singleValue"]',
    },
  },
  DataSourcePicker: {
    container: {
      '10.0.0': 'data-testid Data source picker select container',
      // did not exist prior to 8.3.0
      '8.3.0': 'Data source picker select container',
    },
  },
  TimeZonePicker: {
    containerV2: {
      '8.3.0': 'data-testid Time zone picker select container',
      [MIN_GRAFANA_VERSION]: 'Folder picker select container',
    },
  },
  CodeEditor: {
    container: {
      '10.2.3': 'data-testid Code editor container',
      [MIN_GRAFANA_VERSION]: 'Code editor container',
    },
  },
};

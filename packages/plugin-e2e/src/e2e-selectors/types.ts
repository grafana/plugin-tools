export type E2ESelectors = {
  pages: Pages;
  components: Components;
  apis: APIs;
};

export type APIs = {
  Alerting: {
    eval: string;
  };
  DataSource: {
    resourcePattern: string;
    resourceUIDPattern: string;
    queryPattern: string;
    query: string;
    health: (uid: string, id: string) => string;
    datasourceByUID: (uid: string) => string;
    proxy: (uid: string, id: string) => string;
  };
  Dashboard: {
    delete: (uid: string) => string;
  };
  Plugin: {
    settings: (pluginId: string) => string;
  };
};

export type Components = {
  TimePicker: {
    openButton: string;
    fromField: string;
    toField: string;
    applyTimeRange: string;
    absoluteTimeRangeTitle: string;
  };

  Menu: {
    MenuComponent: (title: string) => string;
    MenuGroup: (title: string) => string;
    MenuItem: (title: string) => string;
    SubMenu: {
      container: string;
      icon: string;
    };
  };
  Panels: {
    Panel: {
      title: (title: string) => string;
      headerCornerInfo: (mode: string) => string;
      status: (status: string) => string;
      toggleTableViewPanel: (title: string) => string;
      PanelDataErrorMessage: string;
      menuItems: (item: string) => string;
      menu: (title: string) => string;
    };
    Visualization: {
      Table: {
        header: string;
        footer: string;
        body: string;
      };
    };
  };
  VizLegend: {
    seriesName: (name: string) => string;
  };
  Drawer: {
    General: {
      title: (title: string) => string;
    };
  };
  PanelEditor: {
    General: {
      content: string;
    };
    applyButton: string;
    toggleVizPicker: string;
    OptionsPane: {
      content: string;
      fieldLabel: (type: string) => string;
      fieldInput: (title: string) => string;
    };
  };
  RefreshPicker: {
    runButtonV2: string;
  };
  QueryEditorRows: {
    rows: string;
  };
  QueryEditorRow: {
    title: (refId: string) => string;
  };
  Alert: {
    alertV2: (severity: string) => string;
  };
  PageToolbar: {
    item: (tooltip: string) => string;
    shotMoreItems: string;
    itemButton: (title: string) => string;
    itemButtonTitle: string;
  };
  OptionsGroup: {
    group: (title?: string) => string;
    toggle: (title?: string) => string;
    groupTitle: string;
  };
  PluginVisualization: {
    item: (title: string) => string;
  };
  Select: {
    option: string;
    input: () => string;
    singleValue: () => string;
  };
  DataSourcePicker: {
    container: string;
  };
  TimeZonePicker: {
    containerV2: string;
    changeTimeSettingsButton: string;
  };
  CodeEditor: {
    container: string;
  };
  Annotations: {
    editor: {
      testButton: string;
      resultContainer: string;
    };
  };
  QueryField: {
    container: string;
  };
};

export type Pages = {
  Home: {
    url: string;
  };
  Alerting: {
    AddAlertRule: {
      url: string;
    };
    EditAlertRule: {
      url: (alertRuleUid: string) => string;
    };
  };
  DataSource: {
    name: string;
    delete: string;
    readOnly: string;
    saveAndTest: string;
    alert: string;
  };
  EditDataSource: {
    url: (dataSourceUid: string) => string;
  };
  AddDashboard: {
    url: string;
    itemButton: (title: string) => string;
    addNewPanel: string;
    itemButtonAddViz: string;
    Settings: {
      Annotations: {
        List: {
          url: string;
        };
        Edit: {
          url: (annotationIndex: string) => string;
        };
      };
      Variables: {
        List: {
          url: string;
        };
        Edit: {
          url: (variableIndex: string) => string;
        };
      };
    };
  };
  Dashboard: {
    url: (uid: string) => string;
    Settings: {
      Annotations: {
        Edit: {
          url: (dashboardUid: string, annotationIndex: string) => string;
        };
        List: {
          url: (uid: string) => string;
          addAnnotationCTA: string;
          addAnnotationCTAV2: string;
        };
      };
      Variables: {
        List: {
          url: (dashboardUid: string) => string;
          newButton: string;
          addVariableCTAV2: (variableName: string) => string;
          addVariableCTAV2Item: string;
          table: string;
        };
        Edit: {
          url: (dashboardUid: string, editIndex: string) => string;
          General: {
            selectionOptionsIncludeAllSwitch: string;
            generalTypeSelectV2: string;
            previewOfValuesOption: string;
            submitButton: string;
          };
        };
      };
    };
  };
  Explore: {
    url: string;
  };
  Plugin: {
    url: (pluginId: string) => string;
  };
};

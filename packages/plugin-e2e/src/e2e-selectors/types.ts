export type E2ESelectors = {
  pages: Pages;
  components: Components;
  apis: APIs;
};

export type APIs = {
  DataSource: {
    getResource: string;
  };
};

export type Components = {
  Breadcrumbs: {
    breadcrumb: (title: string) => string;
  };
  TimePicker: {
    openButton: string;
    fromField: string;
    toField: string;
    applyTimeRange: string;
    calendar: {
      label: string;
      openButton: string;
      closeButton: string;
    };
    absoluteTimeRangeTitle: string;
  };
  DataSourcePermissions: {
    roleType: string;
    rolePicker: string;
    permissionLevel: string;
  };
  DataSource: {
    TestData: {
      QueryTab: {
        scenarioSelectContainer: string;
        scenarioSelect: string;
        max: string;
        min: string;
        noise: string;
        seriesCount: string;
        spread: string;
        startValue: string;
        drop: string;
      };
    };
    DataSourceHttpSettings: {
      urlInput: string;
    };
    Jaeger: {
      traceIDInput: string;
    };
    Prometheus: {
      configPage: {
        connectionSettings: string;
        exemplarsAddButton: string;
        internalLinkSwitch: string;
      };
      exemplarMarker: string;
    };
  };
  Menu: {
    SubMenu: {
      container: string;
      icon: string;
    };
  };
  Panels: {
    Panel: {
      title: (title: string) => string;
      headerItems: (item: string) => string;
      menuItems: (item: string) => string;
      menu: (title: string) => string;
      containerByTitle: (title: string) => string;
      headerCornerInfo: (mode: string) => string;
      status: (status: string) => string;
      loadingBar: () => string;
      HoverWidget: {
        container: string;
        dragIcon: string;
      };
    };
    Visualization: {
      Graph: {
        container: string;
        VisualizationTab: {
          legendSection: string;
        };
        Legend: {
          showLegendSwitch: string;
        };
        xAxis: {};
      };
      BarGauge: {
        value: string;
        valueV2: string;
      };
      PieChart: {
        svgSlice: string;
      };
      Text: {};
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
      expand: string;
      contract: string;
      close: string;
    };
  };
  PanelEditor: {
    General: {
      content: string;
    };
    OptionsPane: {
      content: string;
      select: string;
    };
    DataPane: {
      content: string;
    };
    applyButton: string;
    toggleVizPicker: string;
    toggleVizOptions: string;
    toggleTableView: string;
    showZoomField: string;
    showAttributionField: string;
    showScaleField: string;
    showMeasureField: string;
    showDebugField: string;
    measureButton: string;
  };
  PanelInspector: {
    Data: {
      content: string;
    };
    Stats: {
      content: string;
    };
    Json: {
      content: string;
    };
    Query: {
      content: string;
      refreshButton: string;
    };
  };
  Tab: {
    title: (title: string) => string;
    active: () => string;
  };
  RefreshPicker: {
    runButton: string;
    intervalButton: string;
    runButtonV2: string;
    intervalButtonV2: string;
  };
  QueryTab: {
    content: string;
    queryInspectorButton: string;
    queryHistoryButton: string;
    addQuery: string;
  };
  QueryHistory: {
    queryText: string;
  };
  QueryEditorRows: {
    rows: string;
  };
  QueryEditorRow: {
    actionButton: (title: string) => string;
    title: (refId: string) => string;
    container: (refId: string) => string;
  };
  AlertTab: {
    content: string;
  };
  Alert: {};
  TransformTab: {
    content: string;
  };
  Transforms: {
    Reduce: {
      modeLabel: string;
      calculationsLabel: string;
    };
    SpatialOperations: {
      actionLabel: string;
      locationLabel: string;
      location: {
        autoOption: string;
        coords: {
          option: string;
          latitudeFieldLabel: string;
          longitudeFieldLabel: string;
        };
        geohash: {
          option: string;
          geohashFieldLabel: string;
        };
        lookup: {
          option: string;
          lookupFieldLabel: string;
          gazetteerFieldLabel: string;
        };
      };
    };
    searchInput: string;
    addTransformationButton: string;
  };
  NavBar: {
    Configuration: {
      button: string;
    };
    Toggle: {
      button: string;
    };
    Reporting: {
      button: string;
    };
  };
  NavMenu: {
    item: string;
  };
  NavToolbar: {
    container: string;
  };
  PageToolbar: {
    item: (tooltip: string) => string;
    container: string;
    itemButton: (title: string) => string;
  };
  QueryEditorToolbarItem: {};
  BackButton: {
    backArrow: string;
  };
  OptionsGroup: {
    group: (title?: string) => string;
    toggle: (title?: string) => string;
  };
  PluginVisualization: {
    current: string;
    item: (title: string) => string;
  };
  Select: {
    option: string;
  };
  FieldConfigEditor: {
    content: string;
  };
  OverridesConfigEditor: {
    content: string;
  };
  FolderPicker: {
    container: string;
    containerV2: string;
    input: string;
  };
  ReadonlyFolderPicker: {
    container: string;
  };
  DataSourcePicker: {
    container: string;
    inputV2: string;
  };
  TimeZonePicker: {
    container: string;
    containerV2: string;
  };
  WeekStartPicker: {
    container: string;
    containerV2: string;
    placeholder: string;
  };
  TraceViewer: {
    spanBar: string;
  };
  QueryField: {
    container: string;
  };
  QueryBuilder: {
    queryPatterns: string;
    labelSelect: string;
    valueSelect: string;
    matchOperatorSelect: string;
  };
  ValuePicker: {};
  Search: {
    section: string;
    sectionV2: string;
    items: string;
    itemsV2: string;
    cards: string;
    dashboardItems: string;
  };
  DashboardLinks: {
    container: string;
    dropDown: string;
    link: string;
  };
  LoadingIndicator: {
    icon: string;
  };
  CallToActionCard: {};
  DataLinksContextMenu: {
    singleLink: string;
  };
  CodeEditor: {
    container: string;
  };
  DashboardImportPage: {
    textarea: string;
    submit: string;
  };
  ImportDashboardForm: {
    name: string;
    submit: string;
  };
  PanelAlertTabContent: {
    content: string;
  };
  VisualizationPreview: {};
  ColorSwatch: {
    name: string;
  };
  DashboardRow: {};
  UserProfile: {
    profileSaveButton: string;
    preferencesSaveButton: string;
    orgsTable: string;
    sessionsTable: string;
  };
  FileUpload: {
    inputField: string;
    fileNameSpan: string;
  };
  DebugOverlay: {
    wrapper: string;
  };
  OrgRolePicker: {
    input: string;
  };
  AnalyticsToolbarButton: {
    button: string;
  };
  Variables: {
    variableOption: string;
  };
  Annotations: {
    annotationsTypeInput: string;
    annotationsChoosePanelInput: string;
  };
  Tooltip: {
    container: string;
  };
};

export type Pages = {
  Login: {
    url: string;
    username: string;
    password: string;
    submit: string;
    skip: string;
  };
  Home: {
    url: string;
  };
  DataSource: {
    name: string;
    delete: string;
    readOnly: string;
    saveAndTest: string;
    alert: string;
  };
  DataSources: {
    url: string;
    dataSources: (dataSourceName: string) => string;
  };
  EditDataSource: {
    url: (dataSourceUid: string) => string;
    settings: string;
  };
  AddDataSource: {
    url: string;
    /** @deprecated Use dataSourcePluginsV2 */
    dataSourcePlugins: (pluginName: string) => string;
    dataSourcePluginsV2: (pluginName: string) => string;
  };
  ConfirmModal: {
    delete: string;
  };
  AddDashboard: {
    url: string;
    itemButton: (title: string) => string;
    addNewPanel: string;
    addNewRow: string;
    addNewPanelLibrary: string;
  };
  Dashboard: {
    url: (uid: string) => string;
    DashNav: {
      nav: string;
      navV2: string;
      publicDashboardTag: string;
    };
    SubMenu: {
      submenu: string;
      submenuItem: string;
      submenuItemLabels: (item: string) => string;
      submenuItemValueDropDownValueLinkTexts: (item: string) => string;
      submenuItemValueDropDownDropDown: string;
      submenuItemValueDropDownOptionTexts: (item: string) => string;
      Annotations: {
        annotationsWrapper: string;
        annotationLabel: (label: string) => string;
        annotationToggle: (label: string) => string;
      };
    };
    Settings: {
      Actions: {
        close: string;
      };
      General: {
        deleteDashBoard: string;
        sectionItems: (item: string) => string;
        saveDashBoard: string;
        saveAsDashBoard: string;
        timezone: string;
        title: string;
      };
      Annotations: {
        List: {
          /**
           * @deprecated use addAnnotationCTAV2 from Grafana 8.3 instead
           */
          addAnnotationCTA: string;
          addAnnotationCTAV2: string;
        };
        Settings: {
          name: string;
        };
        NewAnnotation: {
          panelFilterSelect: string;
          showInLabel: string;
          previewInDashboard: string;
        };
      };
      Variables: {
        List: {
          newButton: string;
          table: string;
          tableRowNameFields: (variableName: string) => string;
          tableRowDefinitionFields: (variableName: string) => string;
          tableRowArrowUpButtons: (variableName: string) => string;
          tableRowArrowDownButtons: (variableName: string) => string;
          tableRowDuplicateButtons: (variableName: string) => string;
          tableRowRemoveButtons: (variableName: string) => string;
          addVariableCTAV2: (variableName: string) => string;
        };
        Edit: {
          General: {
            headerLink: string;
            modeLabelNew: string;
            modeLabelEdit: string;
            generalNameInput: string;
            generalNameInputV2: string;
            generalTypeSelect: string;
            generalTypeSelectV2: string;
            generalLabelInput: string;
            generalLabelInputV2: string;
            generalHideSelect: string;
            generalHideSelectV2: string;
            selectionOptionsMultiSwitch: string;
            selectionOptionsIncludeAllSwitch: string;
            selectionOptionsCustomAllInput: string;
            selectionOptionsCustomAllInputV2: string;
            previewOfValuesOption: string;
            submitButton: string;
            applyButton: string;
          };
          QueryVariable: {
            queryOptionsRefreshSelect: string;
            queryOptionsRefreshSelectV2: string;
            queryOptionsRegExInput: string;
            queryOptionsRegExInputV2: string;
            queryOptionsSortSelect: string;
            queryOptionsSortSelectV2: string;
            queryOptionsQueryInput: string;
            valueGroupsTagsEnabledSwitch: string;
            valueGroupsTagsTagsQueryInput: string;
            valueGroupsTagsTagsValuesQueryInput: string;
          };
          ConstantVariable: {
            constantOptionsQueryInput: string;
            constantOptionsQueryInputV2: string;
          };
          DatasourceVariable: {
            datasourceSelect: string;
          };
          TextBoxVariable: {
            textBoxOptionsQueryInput: string;
            textBoxOptionsQueryInputV2: string;
          };
          CustomVariable: {
            customValueInput: string;
          };
          IntervalVariable: {
            intervalsValueInput: string;
          };
        };
      };
    };
    Annotations: {
      marker: string;
    };
    Rows: {
      Repeated: {
        ConfigSection: {
          warningMessage: string;
        };
      };
    };
  };
  Dashboards: {
    url: string;
    dashboards: (title: string) => string;
  };
  SaveDashboardAsModal: {
    newName: string;
    save: string;
  };
  SaveDashboardModal: {
    save: string;
    saveVariables: string;
    saveTimerange: string;
  };
  SharePanelModal: {
    linkToRenderedImage: string;
  };
  ShareDashboardModal: {
    shareButton: string;
    PublicDashboard: {
      Tab: string;
      WillBePublicCheckbox: string;
      LimitedDSCheckbox: string;
      CostIncreaseCheckbox: string;
      PauseSwitch: string;
      EnableAnnotationsSwitch: string;
      CreateButton: string;
      DeleteButton: string;
      CopyUrlInput: string;
      CopyUrlButton: string;
      SettingsDropdown: string;
      TemplateVariablesWarningAlert: string;
      UnsupportedDataSourcesWarningAlert: string;
      NoUpsertPermissionsWarningAlert: string;
      EnableTimeRangeSwitch: string;
      EmailSharingConfiguration: {
        Container: string;
        ShareType: string;
        EmailSharingInput: string;
        EmailSharingInviteButton: string;
        EmailSharingList: string;
        DeleteEmail: string;
        ReshareLink: string;
      };
    };
  };
  PublicDashboard: {
    page: string;
    NotAvailable: {
      container: string;
      title: string;
      pausedDescription: string;
    };
  };
  RequestViewAccess: {
    form: string;
    recipientInput: string;
    submitButton: string;
  };
  Explore: {
    url: string;
    General: {
      container: string;
      graph: string;
      table: string;
      scrollView: string;
    };
  };
  SoloPanel: {
    url: (page: string) => string;
  };
  PluginsList: {
    page: string;
    list: string;
    listItem: string;
    signatureErrorNotice: string;
  };
  PluginPage: {
    page: string;
    signatureInfo: string;
    disabledInfo: string;
  };
  PlaylistForm: {
    name: string;
    interval: string;
    itemDelete: string;
  };
  BrowseDashboards: {
    table: {
      body: string;
      row: (uid: string) => string;
      checkbox: (uid: string) => string;
    };
  };
  Search: {
    url: string;
    FolderView: {
      url: string;
    };
  };
  PublicDashboards: {
    ListItem: {
      linkButton: string;
      configButton: string;
      trashcanButton: string;
      pauseSwitch: string;
    };
  };
  UserListPage: {
    tabs: {
      allUsers: string;
      orgUsers: string;
      publicDashboardsUsers: string;
      users: string;
    };
    org: {
      url: string;
    };
    admin: {
      url: string;
    };
    publicDashboards: {
      container: string;
    };
    UserListAdminPage: {
      container: string;
    };
    UsersListPage: {
      container: string;
    };
    UsersListPublicDashboardsPage: {
      container: string;
      DashboardsListModal: {
        listItem: (uid: string) => string;
      };
    };
  };
  ProfilePage: {
    url: string;
  };
};

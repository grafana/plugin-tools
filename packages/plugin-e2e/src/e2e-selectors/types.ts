import { versionedComponents } from './versioned';
import { versionedAPIs } from './versioned/apis';

export type E2ESelectors = {
  pages: Pages;
  components: SelectorsOf<typeof versionedComponents>;
  apis: SelectorsOf<typeof versionedAPIs>;
};

export type Pages = {
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

// Types to generate typings from the versioned selectors

export type SelectorsOf<T> = {
  [Property in keyof T]: T[Property] extends VersionedSelector
    ? SelectorResolver
    : T[Property] extends VersionedSelectorWithArgs<infer A>
    ? SelectorResolverWithArgs<A>
    : SelectorsOf<T[Property]>;
};

export type SelectorResolver = () => string;

export type SelectorResolverWithArgs<T extends object> = (arg: T) => string;

export type VersionedSelector = Record<string, SelectorResolver>;

export type VersionedSelectorWithArgs<T extends object> = Record<string, SelectorResolverWithArgs<T>>;

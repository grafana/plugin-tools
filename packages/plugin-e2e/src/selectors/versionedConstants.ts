import { VersionedSelectorGroup } from '@grafana/e2e-selectors';
import { MIN_GRAFANA_VERSION } from './minGrafanaVersion';

export const versionedConstants = {
  PageToolBar: {
    itemButtonTitle: {
      '10.1.0': 'Add button',
      [MIN_GRAFANA_VERSION]: 'Add panel button',
    },
  },
  Select: {
    singleValueContainer: {
      [MIN_GRAFANA_VERSION]: () => 'div[class*="-grafana-select-value-container"] > div[class*="-singleValue"]',
    },
    multiValueContainer: {
      [MIN_GRAFANA_VERSION]: () => 'div[class*="-grafana-select-multi-value-container"] > div',
    },
  },
  Cascader: {
    menu: {
      [MIN_GRAFANA_VERSION]: () => 'div[class="rc-cascader-menus"]',
    },
  },
} satisfies VersionedSelectorGroup;

export type VersionedConstants = typeof versionedConstants;

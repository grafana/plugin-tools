import { VersionedSelectorGroup } from '@grafana/e2e-selectors';
import { MIN_GRAFANA_VERSION } from './minGrafanaVersion';

export const versionedConstants = {
  PageToolBar: {
    itemButtonTitle: {
      '10.1.0': 'Add button',
      [MIN_GRAFANA_VERSION]: 'Add panel button',
    },
  },
} satisfies VersionedSelectorGroup;

export type VersionedConstants = typeof versionedConstants;

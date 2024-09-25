import { MIN_GRAFANA_VERSION } from '../e2e-selectors/versioned/constants';
import { VersionedSelectorGroup } from './types';

export const versionedConstants = {
  PageToolBar: {
    itemButtonTitle: {
      '10.1.0': 'Add button',
      [MIN_GRAFANA_VERSION]: 'Add panel button',
    }
  }
} satisfies VersionedSelectorGroup;

export type VersionedConstants = typeof versionedConstants;

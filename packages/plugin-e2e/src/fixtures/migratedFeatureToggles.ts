import { gte } from '../utils/version';
import { FeatureFlagValue } from '../types';

// the value is the first Grafana version whose frontend reads the flag through OpenFeature and ignores the
// legacy toggle. The "-0" lets pre-release builds of that version match, since the change is in them already.
const MIGRATED_TO_OPEN_FEATURE: Record<string, string> = {
  dashboardNewLayouts: '13.3.0-0',
};

/**
 * Returns the flags to apply through OpenFeature, with legacy toggles that Grafana has migrated mirrored in.
 * Flags set explicitly through `openFeature.flags` win over mirrored toggles.
 */
export function mirrorMigratedToggles(
  featureToggles: Record<string, boolean>,
  flags: Record<string, FeatureFlagValue>,
  grafanaVersion: string
): Record<string, FeatureFlagValue> {
  const mirrored: Record<string, FeatureFlagValue> = {};

  for (const [toggle, value] of Object.entries(featureToggles)) {
    const migratedIn = MIGRATED_TO_OPEN_FEATURE[toggle];
    if (migratedIn && gte(grafanaVersion, migratedIn)) {
      mirrored[toggle] = value;
    }
  }

  return { ...mirrored, ...flags };
}

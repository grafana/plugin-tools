import { FeatureFlagValue } from '../types';

// mirroring is harmless on Grafana versions that still read these from boot data, since their frontend ignores OFREP
const MIGRATED_TO_OPEN_FEATURE = new Set(['dashboardNewLayouts']);

/**
 * Returns the flags to apply through OpenFeature, with legacy toggles that Grafana has migrated mirrored in.
 * Flags set explicitly through `openFeature.flags` win over mirrored toggles.
 */
export function mirrorMigratedToggles(
  featureToggles: Record<string, boolean>,
  flags: Record<string, FeatureFlagValue>
): Record<string, FeatureFlagValue> {
  const mirrored = Object.fromEntries(
    Object.entries(featureToggles).filter(([toggle]) => MIGRATED_TO_OPEN_FEATURE.has(toggle))
  );

  return { ...mirrored, ...flags };
}

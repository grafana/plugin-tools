import { describe, expect, it } from 'vitest';

import { mirrorMigratedToggles } from './migratedFeatureToggles';

describe('mirrorMigratedToggles', () => {
  it('mirrors a migrated toggle', () => {
    expect(mirrorMigratedToggles({ dashboardNewLayouts: false }, {})).toEqual({ dashboardNewLayouts: false });
  });

  it('does not mirror toggles that have not been migrated', () => {
    expect(mirrorMigratedToggles({ exploreMixedDatasource: true }, {})).toEqual({});
  });

  it('lets explicit openFeature flags win over mirrored toggles', () => {
    expect(mirrorMigratedToggles({ dashboardNewLayouts: false }, { dashboardNewLayouts: true })).toEqual({
      dashboardNewLayouts: true,
    });
  });

  it('keeps unrelated openFeature flags', () => {
    expect(mirrorMigratedToggles({ dashboardNewLayouts: false }, { other: 'x' })).toEqual({
      dashboardNewLayouts: false,
      other: 'x',
    });
  });
});

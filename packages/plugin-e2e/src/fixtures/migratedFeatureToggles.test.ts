import { describe, expect, it } from 'vitest';

import { mirrorMigratedToggles } from './migratedFeatureToggles';

describe('mirrorMigratedToggles', () => {
  it.each(['13.3.0', '13.4.0-local', '13.3.0-25389005429'])('mirrors a migrated toggle on %s', (grafanaVersion) => {
    expect(mirrorMigratedToggles({ dashboardNewLayouts: false }, {}, grafanaVersion)).toEqual({
      dashboardNewLayouts: false,
    });
  });

  it('does not mirror a migrated toggle on older versions', () => {
    expect(mirrorMigratedToggles({ dashboardNewLayouts: false }, {}, '13.2.6')).toEqual({});
  });

  it('does not mirror toggles that have not been migrated', () => {
    expect(mirrorMigratedToggles({ exploreMixedDatasource: true }, {}, '13.3.0')).toEqual({});
  });

  it('lets explicit openFeature flags win over mirrored toggles', () => {
    expect(mirrorMigratedToggles({ dashboardNewLayouts: false }, { dashboardNewLayouts: true }, '13.3.0')).toEqual({
      dashboardNewLayouts: true,
    });
  });

  it('keeps unrelated openFeature flags', () => {
    expect(mirrorMigratedToggles({ dashboardNewLayouts: false }, { other: 'x' }, '13.3.0')).toEqual({
      dashboardNewLayouts: false,
      other: 'x',
    });
  });
});

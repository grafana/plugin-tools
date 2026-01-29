import { expect, test } from '../../../src';
import { lt } from 'semver';

test.use({
  openFeature: {
    flags: {
      booleanFlagTrue: true,
      booleanFlagFalse: false,
      stringFlag: 'enabled',
      numberFlag: 42,
    },
  },
});

test.describe('getBooleanOpenFeatureFlag fixture', () => {
  test('should retrieve boolean flag values', async ({ getBooleanOpenFeatureFlag, grafanaVersion }) => {
    test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

    const flagTrue = await getBooleanOpenFeatureFlag('booleanFlagTrue');
    const flagFalse = await getBooleanOpenFeatureFlag('booleanFlagFalse');

    expect(flagTrue).toBe(true);
    expect(flagFalse).toBe(false);
  });

  test('should throw error for non-boolean flags', async ({ getBooleanOpenFeatureFlag, grafanaVersion }) => {
    test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

    await expect(getBooleanOpenFeatureFlag('stringFlag')).rejects.toThrow(
      /Expected boolean value for flag "stringFlag", but got string/
    );
    await expect(getBooleanOpenFeatureFlag('numberFlag')).rejects.toThrow(
      /Expected boolean value for flag "numberFlag", but got number/
    );
  });

  test('should throw error for non-existent flags', async ({ getBooleanOpenFeatureFlag, grafanaVersion }) => {
    test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');
    await expect(getBooleanOpenFeatureFlag('nonExistentFlag')).rejects.toThrow(/Failed to fetch OpenFeature flag/);
  });
});

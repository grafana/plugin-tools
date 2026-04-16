import { Locator, TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../../types';
import { DataSourcePicker } from '../../models/components/DataSourcePicker';

type GetDataSourcePickerFixture = TestFixture<(root?: Locator) => DataSourcePicker, PlaywrightArgs>;

export const getDataSourcePicker: GetDataSourcePickerFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use((root?: Locator) => {
    return new DataSourcePicker({ page, selectors, grafanaVersion, request, testInfo }, root);
  });
};

import { TestFixture } from '@playwright/test';

import { setDataSnapshotDefaults } from '../matchers/dataSnapshot';
import { PluginOptions } from '../types';

type DataSnapshotDefaultsFixture = TestFixture<void, Pick<PluginOptions, 'dataSnapshot'>>;

/**
 * Hands the resolved `dataSnapshot` option to the `toMatchDataSnapshot` matcher, which can't read fixtures.
 * @internal
 */
export const dataSnapshotDefaults: DataSnapshotDefaultsFixture = async ({ dataSnapshot }, use, testInfo) => {
  setDataSnapshotDefaults(testInfo, dataSnapshot);
  await use();
};

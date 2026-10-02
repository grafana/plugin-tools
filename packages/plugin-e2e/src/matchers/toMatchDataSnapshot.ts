import { ExpectMatcherState, test, TestInfo } from '@playwright/test';

import { Panel } from '../models/components/Panel';
import { GetPanelDataOptions } from '../models/components/panelData';
import {
  compareDataSnapshot,
  DataSnapshotOptions,
  getDataSnapshotPath,
  prettyPrintJson,
  serializeDataSnapshot,
} from './dataSnapshot';

export interface MatchDataSnapshotOptions
  extends DataSnapshotOptions, Pick<GetPanelDataOptions, 'states' | 'timeout'> {}

const snapshotCounts = new WeakMap<TestInfo, Map<string, number>>();

function getUniqueName(testInfo: TestInfo, name: string): string {
  const counts = snapshotCounts.get(testInfo) ?? new Map<string, number>();
  snapshotCounts.set(testInfo, counts);
  const count = counts.get(name) ?? 0;
  counts.set(name, count + 1);
  return count === 0 ? name : `${name}-${count}`;
}

/**
 * @alpha - the API is not yet stable and may change without a major version bump. Use with caution.
 */
export async function toMatchDataSnapshot(
  this: ExpectMatcherState,
  panel: Panel,
  nameOrOptions?: string | MatchDataSnapshotOptions,
  maybeOptions?: MatchDataSnapshotOptions
) {
  const name = typeof nameOrOptions === 'string' ? nameOrOptions : 'panel-data';
  const options = (typeof nameOrOptions === 'string' ? maybeOptions : nameOrOptions) ?? {};
  const testInfo = test.info();

  const data = await panel.getData({ states: options.states, timeout: options.timeout });
  const actual = serializeDataSnapshot(data, options);
  const path = getDataSnapshotPath(testInfo.file, testInfo.titlePath.slice(1), getUniqueName(testInfo, name));
  const result = compareDataSnapshot(path, actual, testInfo.config.updateSnapshots);

  if (!result.pass) {
    await testInfo.attach(`${name}-actual.json`, { body: actual, contentType: 'application/json' });
  }

  return {
    pass: result.pass,
    name: 'toMatchDataSnapshot',
    expected: result.expected,
    actual,
    message: () => {
      if (result.expected === undefined || result.pass) {
        return result.message;
      }
      const diff = this.utils.diff(prettyPrintJson(result.expected), actual);
      return `${result.message}\n\n${diff ?? ''}\n\nRun with --update-snapshots (-u) if this change is expected.`;
    },
  };
}

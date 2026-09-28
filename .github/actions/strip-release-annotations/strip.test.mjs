import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { strip } from './strip.mjs';

const released = (name, version) => `  {\n    name: '${name}',\n    version: '${version}',\n  },`;
const annotated = (name, version) =>
  `  {\n    name: '${name}',\n    version: '${version}', // x-release-please-version\n  },`;

describe('strip', () => {
  it('removes the annotation from a version line release-please has rewritten', () => {
    const result = strip(annotated('014-a', '7.12.0'));

    assert.equal(result.source, released('014-a', '7.12.0'));
    assert.equal(result.strippedCount, 1);
  });

  it('removes every annotation', () => {
    const source = [released('013-a', '7.10.1'), annotated('014-b', '7.12.0'), annotated('015-c', '7.12.0')].join('\n');

    const result = strip(source);

    assert.equal(
      result.source,
      [released('013-a', '7.10.1'), released('014-b', '7.12.0'), released('015-c', '7.12.0')].join('\n')
    );
    assert.equal(result.strippedCount, 2);
  });

  it('leaves a source with no annotations unchanged', () => {
    const source = [released('013-a', '7.10.1'), released('014-b', '7.12.0')].join('\n');

    const result = strip(source);

    assert.equal(result.source, source);
    assert.equal(result.strippedCount, 0);
  });

  it('only touches version lines', () => {
    const source = `  // mentions x-release-please-version\n${annotated('014-a', '7.12.0')}`;

    const result = strip(source);

    assert.equal(result.source, `  // mentions x-release-please-version\n${released('014-a', '7.12.0')}`);
  });

  it('keeps the annotation on versions release-please has not rewritten', () => {
    // create-plugin is not part of every release PR. Its unreleased migrations must stay annotated so a later
    // release can still freeze them.
    const source = annotated('014-a', '0.0.0-unreleased');

    const result = strip(source);

    assert.equal(result.source, source);
    assert.equal(result.strippedCount, 0);
  });
});

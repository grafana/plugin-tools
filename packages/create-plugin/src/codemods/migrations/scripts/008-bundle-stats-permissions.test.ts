import { describe, it, expect } from 'vitest';
import { Context } from '../../context.js';
import migrate from './008-bundle-stats-permissions.js';
import { parse } from 'yaml';

const workflowPath = './.github/workflows/bundle-stats.yml';
const legacyWorkflowPath = './.github/workflows/bundle-size.yml';

describe('008-bundle-stats-permissions', () => {
  it('should not modify anything if workflow file does not exist', async () => {
    const context = new Context('/virtual');

    await migrate(context);

    expect(context.listChanges()).toEqual({});
  });

  it('should not modify anything if workflow file is empty', async () => {
    const context = new Context('/virtual');
    context.addFile(workflowPath, '');
    const initialChanges = context.listChanges();

    await migrate(context);

    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not modify anything if permissions block is missing', async () => {
    const context = new Context('/virtual');
    context.addFile(
      workflowPath,
      `name: Bundle Stats
on: [pull_request]
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`
    );
    const initialChanges = context.listChanges();

    await migrate(context);

    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not modify anything if permissions.contents key is missing', async () => {
    const context = new Context('/virtual');
    context.addFile(
      workflowPath,
      `name: Bundle Stats
on: [pull_request]
permissions:
  pull-requests: write
  actions: read
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`
    );
    const initialChanges = context.listChanges();

    await migrate(context);

    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not modify anything if permissions.contents is already read', async () => {
    const context = new Context('/virtual');
    const original = `name: Bundle Stats
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
  actions: read
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`;
    context.addFile(workflowPath, original);

    await migrate(context);

    expect(context.getFile(workflowPath)).toBe(original);
  });

  it('should not modify anything if permissions.contents is none', async () => {
    const context = new Context('/virtual');
    const original = `name: Bundle Stats
on: [pull_request]
permissions:
  contents: none
  pull-requests: write
  actions: read
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`;
    context.addFile(workflowPath, original);

    await migrate(context);

    expect(context.getFile(workflowPath)).toBe(original);
  });

  it('should update permissions.contents from write to read', async () => {
    const context = new Context('/virtual');
    context.addFile(
      workflowPath,
      `name: Bundle Stats
on: [pull_request]
permissions:
  contents: write
  pull-requests: write
  actions: read
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`
    );

    await migrate(context);

    const migrated = parse(context.getFile(workflowPath) || '');
    expect(migrated.permissions.contents).toBe('read');
  });

  it('should preserve other permissions when updating contents', async () => {
    const context = new Context('/virtual');
    context.addFile(
      workflowPath,
      `name: Bundle Stats
on: [pull_request]
permissions:
  contents: write
  pull-requests: write
  actions: read
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`
    );

    await migrate(context);

    const migrated = parse(context.getFile(workflowPath) || '');
    expect(migrated.permissions).toEqual({
      contents: 'read',
      'pull-requests': 'write',
      actions: 'read',
    });
  });

  it('should update permissions.contents in the legacy bundle-size.yml workflow', async () => {
    const context = new Context('/virtual');
    context.addFile(
      legacyWorkflowPath,
      `name: Bundle Stats
on: [pull_request]
permissions:
  contents: write
  pull-requests: write
  actions: read
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`
    );

    await migrate(context);

    const migrated = parse(context.getFile(legacyWorkflowPath) || '');
    expect(migrated.permissions.contents).toBe('read');
  });

  it('should update both workflow filenames if both exist', async () => {
    const context = new Context('/virtual');
    const original = `name: Bundle Stats
on: [pull_request]
permissions:
  contents: write
  pull-requests: write
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`;
    context.addFile(workflowPath, original);
    context.addFile(legacyWorkflowPath, original);

    await migrate(context);

    expect(parse(context.getFile(workflowPath) || '').permissions.contents).toBe('read');
    expect(parse(context.getFile(legacyWorkflowPath) || '').permissions.contents).toBe('read');
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(
      workflowPath,
      `name: Bundle Stats
on: [pull_request]
permissions:
  contents: write
  pull-requests: write
  actions: read
jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
`
    );

    await expect(migrate).toBeIdempotent(context);
  });
});

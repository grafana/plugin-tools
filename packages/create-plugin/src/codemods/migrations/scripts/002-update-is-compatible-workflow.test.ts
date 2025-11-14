import { describe, it, expect } from 'vitest';
import { Context } from '../../context.js';
import migrate from './002-update-is-compatible-workflow.js';
import { parse } from 'yaml';

describe('002-update-is-compatible-workflow', () => {
  it('should not modify anything if workflow file does not exist', async () => {
    const context = new Context('/virtual');
    await migrate(context);
    expect(context.listChanges()).toEqual({});
  });

  it('should not modify anything if workflow file is empty', async () => {
    const context = new Context('/virtual');
    context.addFile('./.github/workflows/is-compatible.yml', '');
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not modify anything if jobs section is missing', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.github/workflows/is-compatible.yml',
      `name: Latest Grafana API compatibility check
on: [pull_request]
`
    );
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not modify anything if compatibilitycheck job is missing', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.github/workflows/is-compatible.yml',
      `name: Latest Grafana API compatibility check
on: [pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`
    );
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not modify anything if compatibility check step is not found', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.github/workflows/is-compatible.yml',
      `name: Latest Grafana API compatibility check
on: [pull_request]
jobs:
  compatibilitycheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build plugin
        run: {{ packageManagerName }} run build
`
    );
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should update the compatibility check step with the new pattern', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.github/workflows/is-compatible.yml',
      `name: Latest Grafana API compatibility check
on: [pull_request]

jobs:
  compatibilitycheck:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - name: Setup Node.js environment
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: '22'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build plugin
        run: npm run build
      - name: Compatibility check
        run: npx --yes @grafana/levitate@latest is-compatible --path $(find ./src -type f \( -name "module.ts" -o -name "module.tsx" \)) --target @grafana/data,@grafana/ui,@grafana/runtime
`
    );

    await migrate(context);

    const migratedContent = context.getFile('./.github/workflows/is-compatible.yml') || '';
    const migrated = parse(migratedContent);

    expect(migrated.jobs.compatibilitycheck.steps[4]).toEqual({
      name: 'Find module.ts or module.tsx',
      id: 'find-module-ts',
      // notice the double backslash `\\(`  even though the actual file has only `\(`
      // this is because `parse` will return the strings escaped and as we are comparing strings directly we also have to escape it
      run: 'MODULETS="$(find ./src -type f \\( -name "module.ts" -o -name "module.tsx" \\))"\necho "modulets=${MODULETS}" >> $GITHUB_OUTPUT',
    });

    expect(migrated.jobs.compatibilitycheck.steps[5]).toEqual({
      name: 'Compatibility check',
      uses: 'grafana/plugin-actions/is-compatible@main',
      with: {
        'fail-if-incompatible': 'yes',
        'comment-pr': 'no',
        module: '${{ steps.find-module-ts.outputs.modulets }}',
      },
    });
  });

  it('should preserve other steps in the workflow', async () => {
    const context = new Context('/virtual');
    const originalWorkflow = `name: Latest Grafana API compatibility check
on: [pull_request]

jobs:
  compatibilitycheck:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - name: Setup Node.js environment
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: '22'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build plugin
        run: npm run build
      - name: Compatibility check
        run: npx --yes @grafana/levitate@latest is-compatible --path $(find ./src -type f \( -name "module.ts" -o -name "module.tsx" \)) --target @grafana/data,@grafana/ui,@grafana/runtime
      - name: Post build summary
        run: echo "Build completed successfully" >> $GITHUB_STEP_SUMMARY
`;

    context.addFile('./.github/workflows/is-compatible.yml', originalWorkflow);

    await migrate(context);

    const migratedContent = context.getFile('./.github/workflows/is-compatible.yml') || '';
    const migrated = parse(migratedContent);
    const steps = migrated.jobs.compatibilitycheck.steps;
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[2].name).toBe('Install dependencies');
    expect(steps[steps.length - 1].name).toBe('Post build summary');
    expect(steps[0].uses).toBe('actions/checkout@v4');
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.github/workflows/is-compatible.yml',
      `name: Latest Grafana API compatibility check
on:
  - pull_request
jobs:
  compatibilitycheck:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - name: Setup Node.js environment
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: "22"
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build plugin
        run: npm run build
      - name: Find module.ts or module.tsx
        id: find-module-ts
        run: >-
          MODULETS="$(find ./src -type f ( -name "module.ts" -o -name
          "module.tsx" ))"

          echo "modulets=$\{MODULETS}" >> $GITHUB_OUTPUT
      - name: Compatibility check
        uses: grafana/plugin-actions/is-compatible@main
        with:
          module: $\{{ steps.find-module-ts.outputs.modulets }}
          comment-pr: no
          fail-if-incompatible: yes
`
    );
    await expect(migrate).toBeIdempotent(context);
  });
});

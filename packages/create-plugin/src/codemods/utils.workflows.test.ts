import { Context } from './context.js';
import { bumpActionRefs } from './utils.workflows.js';

const WORKFLOW = '.github/workflows/release.yml';
const BUILD_PLUGIN = 'grafana/plugin-actions/build-plugin';
const PACKAGE_PLUGIN = 'grafana/plugin-actions/package-plugin';
const MINIMUMS = { [BUILD_PLUGIN]: 'build-plugin/v1.2.0', [PACKAGE_PLUGIN]: 'package-plugin/v1.3.3' };

// a release workflow with one step per `uses` value
function workflowWith(...uses: string[]): string {
  return `name: Release\njobs:\n  release:\n    runs-on: ubuntu-latest\n    steps:\n${uses.map((u) => `      - uses: ${u}\n`).join('')}`;
}

function bump(workflow: string, minimums: Record<string, string> = MINIMUMS) {
  const context = new Context('/virtual');
  context.addFile(WORKFLOW, workflow);
  const result = bumpActionRefs(context, WORKFLOW, minimums);
  return { result, content: context.getFile(WORKFLOW) };
}

describe('bumpActionRefs', () => {
  it.each([
    ['a prefixed tag', 'build-plugin/v1.0.2'],
    ['a bare tag', 'v1.0.0'],
  ])('raises %s to the minimum', (_, ref) => {
    const { content, result } = bump(workflowWith(`${BUILD_PLUGIN}@${ref}`));
    expect(content).toBe(workflowWith(`${BUILD_PLUGIN}@build-plugin/v1.2.0`));
    expect(result).toEqual({ found: [BUILD_PLUGIN], unrecognized: [] });
  });

  it.each([
    ['a floating minor tag', 'build-plugin/v1.1', 'build-plugin/v1.2'],
    ['a bare floating minor tag', 'v1.0', 'build-plugin/v1.2'],
    ['a floating major tag', 'v0', 'build-plugin/v1'],
  ])('raises %s and keeps it floating', (_, ref, raised) => {
    const { content } = bump(workflowWith(`${BUILD_PLUGIN}@${ref}`));
    expect(content).toBe(workflowWith(`${BUILD_PLUGIN}@${raised}`));
  });

  it.each(['build-plugin/v1.2.0', 'build-plugin/v2.0.0', 'build-plugin/v1.2', 'build-plugin/v1', 'v1', 'v2', 'main'])(
    'leaves %s alone',
    (ref) => {
      const workflow = workflowWith(`${BUILD_PLUGIN}@${ref}`);
      const { content, result } = bump(workflow);
      expect(content).toBe(workflow);
      expect(result).toEqual({ found: [BUILD_PLUGIN], unrecognized: [] });
    }
  );

  it.each([
    ['a branch', 'some-feature-branch'],
    ['a commit SHA', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
    ["another action's tag", 'package-plugin/v1.0.0'],
    ['a tag with a longer prefix', 'foo/build-plugin/v1.0.0'],
  ])('leaves %s alone and reports it', (_, ref) => {
    const workflow = workflowWith(`${BUILD_PLUGIN}@${ref}`);
    const { content, result } = bump(workflow);
    expect(content).toBe(workflow);
    expect(result).toEqual({ found: [BUILD_PLUGIN], unrecognized: [BUILD_PLUGIN] });
  });

  it('bumps each use independently, to its own action minimum', () => {
    const { content, result } = bump(
      workflowWith(
        `${BUILD_PLUGIN}@v1.0.0`,
        `${BUILD_PLUGIN}@build-plugin/v2.0.0`,
        `${PACKAGE_PLUGIN}@package-plugin/v1.3.2`
      )
    );
    expect(content).toBe(
      workflowWith(
        `${BUILD_PLUGIN}@build-plugin/v1.2.0`,
        `${BUILD_PLUGIN}@build-plugin/v2.0.0`,
        `${PACKAGE_PLUGIN}@package-plugin/v1.3.3`
      )
    );
    expect(result.found).toEqual([BUILD_PLUGIN, PACKAGE_PLUGIN]);
  });

  it('bumps a quoted ref and keeps the quotes and any trailing comment', () => {
    const { content } = bump(workflowWith(`'${BUILD_PLUGIN}@v1.0.0' # pinned`));
    expect(content).toBe(workflowWith(`'${BUILD_PLUGIN}@build-plugin/v1.2.0' # pinned`));
  });

  it('only bumps `uses` values, not incidental mentions', () => {
    const mention = `# see ${BUILD_PLUGIN}@v1.0.0 for reference\nenv:\n  NOTE: ${BUILD_PLUGIN}@v1.0.0\n`;
    const { content } = bump(`${mention}${workflowWith(`${BUILD_PLUGIN}@v1.0.0`)}`);
    expect(content).toBe(`${mention}${workflowWith(`${BUILD_PLUGIN}@build-plugin/v1.2.0`)}`);
  });

  it('keeps comments, blank lines and the rest of the workflow unchanged', () => {
    const before = [
      '# release on tag',
      'name: Release',
      '',
      'on:',
      '  push:',
      "    tags: ['v*']",
      '',
      'jobs:',
      '  release:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v6 # keep me',
      `      - uses: ${BUILD_PLUGIN}@v1.0.0`,
      '        with:',
      '          policy_token: ${{ secrets.TOKEN }}',
      '',
    ].join('\n');
    const { content } = bump(before);
    expect(content).toBe(before.replace(`${BUILD_PLUGIN}@v1.0.0`, `${BUILD_PLUGIN}@build-plugin/v1.2.0`));
  });

  it('leaves an indented commented-out block exactly as it was', () => {
    const before = workflowWith(
      `${BUILD_PLUGIN}@v1.0.0\n        #with:\n          # save the token in your repository secrets\n          #policy_token: \${{ secrets.TOKEN }}`
    );
    const { content } = bump(before);
    expect(content).toBe(before.replace(`${BUILD_PLUGIN}@v1.0.0`, `${BUILD_PLUGIN}@build-plugin/v1.2.0`));
  });

  it('leaves a workflow it cannot parse alone', () => {
    const workflow = `jobs: [\n  uses: ${BUILD_PLUGIN}@v1.0.0\n`;
    const { content, result } = bump(workflow);
    expect(content).toBe(workflow);
    expect(result).toEqual({ found: [], unrecognized: [] });
  });

  it('does not match an action whose name only starts with the given one', () => {
    const workflow = workflowWith(`${BUILD_PLUGIN}-extra@v1.0.0`);
    const { content, result } = bump(workflow);
    expect(content).toBe(workflow);
    expect(result.found).toEqual([]);
  });

  it('reports nothing found when the workflow uses none of the actions', () => {
    const { content, result } = bump('name: Release\n');
    expect(content).toBe('name: Release\n');
    expect(result).toEqual({ found: [], unrecognized: [] });
  });

  it('reports nothing found when the workflow does not exist', () => {
    const context = new Context('/virtual');
    expect(bumpActionRefs(context, WORKFLOW, MINIMUMS)).toEqual({ found: [], unrecognized: [] });
    expect(context.doesFileExist(WORKFLOW)).toBe(false);
  });

  it('throws when a minimum is not a version tag', () => {
    expect(() => bump(workflowWith(`${BUILD_PLUGIN}@v1.0.0`), { [BUILD_PLUGIN]: 'main' })).toThrow(
      "The minimum ref 'main' for grafana/plugin-actions/build-plugin is not a version tag."
    );
  });
});

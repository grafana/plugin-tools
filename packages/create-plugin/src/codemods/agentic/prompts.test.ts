import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildDirectiveBlock,
  buildHybridUserPrompt,
  buildNextStepsLine,
  buildPromptOnlyUserPrompt,
  buildSystemPrompt,
  escapeXmlBody,
  getPromptPath,
  loadPromptInstructions,
} from './prompts.js';

const additionMeta = {
  name: 'rspack-overrides',
  description: 'Port custom webpack overrides to rspack.',
};

const systemPromptOptions = {
  workspaceRoot: '/virtual/workspace',
  packageManagerName: 'npm',
  packageManagerVersion: '11.0.0',
  installCmd: 'npm install --silent',
  execCmd: 'npx -y',
  handoffPath: '/virtual/workspace/node_modules/.cache/grafana-create-plugin/agent-runs/run-1/rspack-overrides.json',
};

describe('escapeXmlBody', () => {
  it('should escape ampersands and angle brackets', () => {
    expect(escapeXmlBody('use <script> & "quotes"')).toBe('use &lt;script&gt; &amp; "quotes"');
  });
});

describe('prompt file loading', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cp-prompts-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should resolve a file URL to a filesystem path', () => {
    const promptPath = join(dir, 'rspack-overrides.md');
    expect(getPromptPath(pathToFileURL(promptPath).href)).toBe(promptPath);
  });

  it('should read instructions from a file URL', () => {
    const promptPath = join(dir, 'rspack-overrides.md');
    writeFileSync(promptPath, '# Do the thing');
    expect(loadPromptInstructions(pathToFileURL(promptPath).href)).toBe('# Do the thing');
  });
});

describe('buildSystemPrompt', () => {
  const systemPrompt = buildSystemPrompt(systemPromptOptions);

  it('should include every section of the contract', () => {
    for (const section of [
      '<role>',
      '<workspace_root>',
      '<package_manager>',
      '<project_context>',
      '<opening_brief>',
      '<scope_rules>',
      '<handoff_contract>',
      '<environment_note>',
    ]) {
      expect(systemPrompt).toContain(section);
    }
  });

  it('should frame the session as one addition applied by add', () => {
    expect(systemPrompt).toContain('create-plugin add');
    expect(systemPrompt).not.toContain('create-plugin update');
  });

  it('should state the exact handoff path and JSON shape', () => {
    expect(systemPrompt).toContain(systemPromptOptions.handoffPath);
    expect(systemPrompt).toContain('"status"');
    expect(systemPrompt).toContain('"summary"');
  });

  it('should render the package manager commands', () => {
    expect(systemPrompt).toContain('npm install --silent');
    expect(systemPrompt).toContain('npx -y');
  });

  it('should reference the scaffolded agent instructions and protect .config', () => {
    expect(systemPrompt).toContain('.config/AGENTS/instructions.md');
    expect(systemPrompt).toContain('never modify anything under .config/');
  });
});

describe('buildPromptOnlyUserPrompt', () => {
  it('should embed the addition metadata and escaped instructions', () => {
    const userPrompt = buildPromptOnlyUserPrompt({
      addition: additionMeta,
      instructions: 'Replace <webpack> & port loaders.',
      instructionsPath: '/virtual/prompts/rspack-overrides.md',
      handoffPath: systemPromptOptions.handoffPath,
    });

    expect(userPrompt).toContain('name="rspack-overrides"');
    expect(userPrompt).toContain('source="/virtual/prompts/rspack-overrides.md"');
    expect(userPrompt).toContain('Replace &lt;webpack&gt; &amp; port loaders.');
    expect(userPrompt).toContain(systemPromptOptions.handoffPath);
  });

  it('should not claim the addition has a version', () => {
    const userPrompt = buildPromptOnlyUserPrompt({
      addition: additionMeta,
      instructions: 'Do the thing.',
      instructionsPath: '/virtual/prompts/rspack-overrides.md',
      handoffPath: systemPromptOptions.handoffPath,
    });

    expect(userPrompt).not.toContain('version=');
  });
});

describe('buildHybridUserPrompt', () => {
  const baseOptions = {
    addition: additionMeta,
    instructions: 'Port the overrides.',
    instructionsPath: '/virtual/prompts/rspack-overrides.md',
    handoffPath: systemPromptOptions.handoffPath,
  };

  it('should point at the working tree diff when the tree started clean', () => {
    const userPrompt = buildHybridUserPrompt({ ...baseOptions, codemodChanges: { kind: 'git-diff' } });

    expect(userPrompt).toContain('git status');
    expect(userPrompt).toContain('git diff');
    expect(userPrompt).not.toContain('<files_changed>');
  });

  it('should not claim earlier steps were committed', () => {
    const userPrompt = buildHybridUserPrompt({ ...baseOptions, codemodChanges: { kind: 'git-diff' } });

    expect(userPrompt).not.toContain('earlier steps');
  });

  it('should embed the changed file list when the tree was already dirty', () => {
    const userPrompt = buildHybridUserPrompt({
      ...baseOptions,
      codemodChanges: {
        kind: 'file-list',
        files: [
          { path: 'package.json', changeType: 'update' },
          { path: 'webpack.config.ts', changeType: 'delete' },
          { path: 'rspack.config.ts', changeType: 'add' },
        ],
      },
    });

    expect(userPrompt).toContain('<files_changed>');
    expect(userPrompt).toContain('[UPDATE] package.json');
    expect(userPrompt).toContain('[DELETE] webpack.config.ts');
    expect(userPrompt).toContain('[ADD] rspack.config.ts');
  });

  it('should tell the agent not to trust git diff when the tree was already dirty', () => {
    const userPrompt = buildHybridUserPrompt({
      ...baseOptions,
      codemodChanges: { kind: 'file-list', files: [{ path: 'package.json', changeType: 'update' }] },
    });

    expect(userPrompt).toContain('use this list rather than');
  });

  it('should cap the embedded file list at 50 entries', () => {
    const files = Array.from({ length: 60 }, (_, index) => ({
      path: `src/file-${index}.ts`,
      changeType: 'update' as const,
    }));
    const userPrompt = buildHybridUserPrompt({ ...baseOptions, codemodChanges: { kind: 'file-list', files } });

    expect(userPrompt).toContain('[UPDATE] src/file-49.ts');
    expect(userPrompt).not.toContain('[UPDATE] src/file-50.ts');
    expect(userPrompt).toContain('and 10 more files');
  });

  it('should state that the instructions take precedence', () => {
    const userPrompt = buildHybridUserPrompt({ ...baseOptions, codemodChanges: { kind: 'git-diff' } });

    expect(userPrompt).toContain('<precedence>');
  });
});

describe('deferred addition output', () => {
  const deferredAddition = {
    name: 'rspack-overrides',
    description: 'Port custom webpack <overrides> & loaders.',
    instructionsPath: '/a/rspack-overrides.md',
  };

  it('should render a directive block for the outer agent', () => {
    const directive = buildDirectiveBlock(deferredAddition);

    expect(directive).toContain('<create_plugin_agent_directive>');
    expect(directive).toContain('name="rspack-overrides"');
    expect(directive).toContain('instructions_file="/a/rspack-overrides.md"');
    expect(directive).toContain('Port custom webpack &lt;overrides&gt; &amp; loaders.');
    expect(directive).toContain('No handoff file is required');
  });

  it('should render a manual next-steps line', () => {
    const line = buildNextStepsLine(deferredAddition);

    expect(line).toContain('rspack-overrides');
    expect(line).toContain('/a/rspack-overrides.md');
  });
});

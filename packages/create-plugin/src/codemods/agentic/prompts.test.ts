import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildDirectiveBlock,
  buildHybridUserPrompt,
  buildNextStepsList,
  buildPromptOnlyUserPrompt,
  buildSystemPrompt,
  escapeXmlBody,
  getPromptPath,
  loadPromptInstructions,
} from './prompts.js';

const migrationMeta = {
  name: '013-example',
  version: '8.0.0',
  description: 'Port custom webpack overrides to rspack.',
};

const systemPromptOptions = {
  workspaceRoot: '/virtual/workspace',
  packageManagerName: 'npm',
  packageManagerVersion: '11.0.0',
  installCmd: 'npm install --silent',
  execCmd: 'npx -y',
  handoffPath: '/virtual/workspace/node_modules/.cache/grafana-create-plugin/migrate-runs/run-1/013-example.json',
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
    const promptPath = join(dir, '013-example.md');
    expect(getPromptPath(pathToFileURL(promptPath).href)).toBe(promptPath);
  });

  it('should read instructions from a file URL', () => {
    const promptPath = join(dir, '013-example.md');
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
  it('should embed the migration metadata and escaped instructions', () => {
    const userPrompt = buildPromptOnlyUserPrompt({
      migration: migrationMeta,
      instructions: 'Replace <webpack> & port loaders.',
      instructionsPath: '/virtual/prompts/013-example.md',
      handoffPath: systemPromptOptions.handoffPath,
    });

    expect(userPrompt).toContain('name="013-example"');
    expect(userPrompt).toContain('version="8.0.0"');
    expect(userPrompt).toContain('source="/virtual/prompts/013-example.md"');
    expect(userPrompt).toContain('Replace &lt;webpack&gt; &amp; port loaders.');
    expect(userPrompt).toContain(systemPromptOptions.handoffPath);
  });
});

describe('buildHybridUserPrompt', () => {
  const baseOptions = {
    migration: migrationMeta,
    instructions: 'Port the overrides.',
    instructionsPath: '/virtual/prompts/013-example.md',
    handoffPath: systemPromptOptions.handoffPath,
  };

  it('should point at git when the codemod changes are committed', () => {
    const userPrompt = buildHybridUserPrompt({ ...baseOptions, codemodChanges: { kind: 'git-commit' } });
    expect(userPrompt).toContain('git show HEAD');
    expect(userPrompt).not.toContain('<files_changed>');
  });

  it('should embed the changed file list when there is no commit to inspect', () => {
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
    const userPrompt = buildHybridUserPrompt({ ...baseOptions, codemodChanges: { kind: 'git-commit' } });
    expect(userPrompt).toContain('<precedence>');
  });
});

describe('deferred migration output', () => {
  const deferredMigrations = [
    { name: '013-example', description: 'Port custom webpack overrides to rspack.', instructionsPath: '/a/013.md' },
    { name: '014-react-19', description: 'React 19 <compat> & cleanup.', instructionsPath: '/a/014.md' },
  ];

  it('should render one directive block listing every deferred migration', () => {
    const directive = buildDirectiveBlock(deferredMigrations);

    expect(directive).toContain('<create_plugin_agent_directive>');
    expect(directive).toContain('instructions_file="/a/013.md"');
    expect(directive).toContain('instructions_file="/a/014.md"');
    expect(directive).toContain('React 19 &lt;compat&gt; &amp; cleanup.');
    expect(directive).toContain('No handoff file is required');
  });

  it('should render a manual next-steps line per deferred migration', () => {
    const lines = buildNextStepsList(deferredMigrations);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('013-example');
    expect(lines[0]).toContain('/a/013.md');
  });
});

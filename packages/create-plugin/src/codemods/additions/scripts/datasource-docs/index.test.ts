import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../../context.js';
import datasourceDocs from './index.js';

const { existsSync: realExistsSync } = await vi.importActual<typeof import('node:fs')>('node:fs');

vi.mock('node:fs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:fs')>();
  return {
    ...mod,
    existsSync: vi.fn().mockImplementation(mod.existsSync),
  };
});

interface MakeContextOptions {
  pluginJsonExtras?: Record<string, unknown>;
  basePath?: string;
}

function makeContext(opts: MakeContextOptions = {}): Context {
  const { pluginJsonExtras = {}, basePath = '/virtual' } = opts;
  const context = new Context(basePath);
  context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'My Plugin', ...pluginJsonExtras }));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('datasource-docs codemod', () => {
  const tempDirs: string[] = [];

  function makeTempPluginDir(srcFiles: Record<string, string> = {}): string {
    const dir = mkdtempSync(join(tmpdir(), 'datasource-docs-test-'));
    tempDirs.push(dir);
    if (Object.keys(srcFiles).length > 0) {
      mkdirSync(join(dir, 'src'), { recursive: true });
      for (const [relPath, content] of Object.entries(srcFiles)) {
        const target = join(dir, 'src', relPath);
        mkdirSync(join(target, '..'), { recursive: true });
        writeFileSync(target, content);
      }
    }
    return dir;
  }

  beforeEach(() => {
    vi.mocked(existsSync).mockImplementation(realExistsSync);
  });

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  describe('type guard', () => {
    it('errors when plugin.json type is panel', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'X' }));
      expect(() => datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' })).toThrow(
        /only works on 'datasource'.*type is 'panel'.*panel-docs/s
      );
    });

    it('errors when plugin.json type is app', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'app', name: 'X' }));
      expect(() => datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' })).toThrow(
        /only works on 'datasource'/
      );
    });

    it('errors when plugin.json type is unset', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ name: 'X' }));
      expect(() => datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' })).toThrow(/type is 'unset'/);
    });
  });

  describe('generated files', () => {
    it('creates the universal datasource docs files', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/configuration.md')).toBe(true);
      expect(context.doesFileExist('docs/query-editor.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
    });

    it('uses the expected H2s in configuration.md', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/configuration.md') ?? '';
      expect(content).toContain('## Before you begin');
      expect(content).toContain('## Configure the data source');
      expect(content).toContain('## Configuration options');
      expect(content).toContain('## Provision the data source');
    });

    it('uses the expected H2s in query-editor.md', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/query-editor.md') ?? '';
      expect(content).toContain('## Using the query editor');
      expect(content).toContain('## Example queries');
    });

    it('wraps generated sections in section-brief blocks', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/configuration.md') ?? '').toContain('<!-- section-brief:start -->');
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- section-brief:start -->');
    });

    it('writes the validate-docs workflow', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('bumps the build-plugin ref in release.yml', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.github/workflows/release.yml') ?? '';
      expect(content).toContain('grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step');
    });

    it('scaffolds docs/README.md with the plugin name templated in', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('# My Plugin documentation');
      expect(content).toContain('## How docs are published');
      expect(content).toContain('## How to disable multi-page docs');
    });

    it('appends the AI authoring section to README.md when agentLoop is claude', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('## AI authoring assistance');
      expect(content).toContain('bootstrap-plugin-docs');
      expect(content).toContain('### Recommended workflow');
    });

    it('omits the AI authoring section from README.md when agentLoop is none', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).not.toContain('AI authoring assistance');
      expect(content).not.toContain('bootstrap-plugin-docs');
    });

    it('does not scaffold a docs/README.txt (legacy filename)', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/README.txt')).toBe(false);
    });
  });

  describe('AI authoring assistance', () => {
    it('scaffolds docs/AGENTS.md with the plugin name templated in', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/AGENTS.md') ?? '';
      expect(content).toContain('# Plugin docs authoring');
      expect(content).toContain('**My Plugin**');
      expect(content).toContain('## Style rules');
      expect(content).toContain('## Adding a new page');
      // the feature-change directive lives here; instructions.md just points at it
      expect(content).toContain('## Keeping docs in sync with source');
      expect(content).toContain('add, change or remove a feature');
      expect(content).toContain('/write-plugin-docs');
    });

    it('scaffolds all four authoring skills under .claude/skills/', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/write-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/review-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/validate-plugin-docs/SKILL.md')).toBe(true);
    });

    it('does not write the canonical .config/AGENTS/skills/ path', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.config/AGENTS/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('appends a slim Multi-page docs pointer to .config/AGENTS/instructions.md when present', () => {
      const context = makeContext();
      context.addFile(
        '.config/AGENTS/instructions.md',
        '---\nname: agent information\ndescription: existing guide\n---\n\n# Grafana Plugin\n\nExisting content.\n'
      );
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).toContain('Existing content.');
      expect(content).toContain('## Multi-page docs');
      // the directive itself is one sentence; the detail lives in docs/AGENTS.md
      expect(content).toContain('Always update those pages when features change in `src/`');
      expect(content).toContain('docs/AGENTS.md');
      // the section stays terse - no skill list, no bullet expansion
      expect(content).not.toContain('/bootstrap-plugin-docs');
      expect(content).not.toContain('Added feature');
    });

    it('does not duplicate the Multi-page docs section if already present', () => {
      const context = makeContext();
      const seeded = '# Plugin\n\n## Multi-page docs\n\nAlready here.\n';
      context.addFile('.config/AGENTS/instructions.md', seeded);
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content.match(/## Multi-page docs/g)?.length).toBe(1);
    });

    it('does not overwrite existing agent files', () => {
      const context = makeContext();
      context.addFile('docs/AGENTS.md', 'CUSTOMIZED');
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/AGENTS.md')).toBe('CUSTOMIZED');
    });
  });

  describe('agentLoop option', () => {
    it('writes no agent files when agentLoop is none', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(false);
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
      expect(context.doesFileExist('.agents/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
      expect(context.doesFileExist('.cursor/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('throws a friendly error when agentLoop is missing', () => {
      const context = makeContext();
      expect(() => datasourceDocs(context, { docsPath: 'docs' } as never)).toThrow(
        /Missing required flag: --agent-loop[\s\S]*--agent-loop=claude[\s\S]*--agent-loop=none/
      );
    });

    it('writes skills under .claude/skills/ when agentLoop is claude', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
    });

    it('writes skills under .agents/skills/ when agentLoop is codex', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'codex' });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(true);
      expect(context.doesFileExist('.agents/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.agents/skills/write-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('writes skills under .cursor/skills/ when agentLoop is cursor', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs', agentLoop: 'cursor' });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(true);
      expect(context.doesFileExist('.cursor/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
      expect(context.doesFileExist('.agents/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });
  });

  describe('conditional files', () => {
    describe('template-variables.md', () => {
      it('is generated when src contains metricFindQuery', () => {
        const basePath = makeTempPluginDir({
          'datasource.ts': 'export function metricFindQuery(q: string) { return []; }\n',
        });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(true);
        expect(context.getFile('docs/template-variables.md') ?? '').toContain('## Use query variables');
      });

      it('is generated when src contains CustomVariableSupport', () => {
        const basePath = makeTempPluginDir({
          'variables.ts':
            'import { CustomVariableSupport } from "@grafana/data";\nclass V extends CustomVariableSupport {}\n',
        });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(true);
      });

      it('is skipped when no variable-support token is present', () => {
        const basePath = makeTempPluginDir({ 'datasource.ts': 'export function query() {}\n' });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(false);
      });
    });

    describe('annotations.md', () => {
      it('is generated when plugin.json sets annotations: true', () => {
        const context = makeContext({ pluginJsonExtras: { annotations: true } });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/annotations.md')).toBe(true);
        expect(context.getFile('docs/annotations.md') ?? '').toContain('## Create an annotation query');
      });

      it('is skipped when annotations is omitted', () => {
        const context = makeContext();
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/annotations.md')).toBe(false);
      });
    });

    describe('alerting.md', () => {
      it('is generated when both alerting and backend are true', () => {
        const context = makeContext({ pluginJsonExtras: { alerting: true, backend: true } });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(true);
        expect(context.getFile('docs/alerting.md') ?? '').toContain('## Create an alert rule');
      });

      it('is skipped when only alerting is true', () => {
        const context = makeContext({ pluginJsonExtras: { alerting: true } });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(false);
      });

      it('is skipped when only backend is true', () => {
        const context = makeContext({ pluginJsonExtras: { backend: true } });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(false);
      });
    });

    describe('dashboard.md', () => {
      it('is generated when plugin.json includes a dashboard entry', () => {
        const context = makeContext({
          pluginJsonExtras: {
            includes: [{ type: 'dashboard', name: 'overview', path: 'dashboards/overview.json' }],
          },
        });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/dashboard.md')).toBe(true);
        expect(context.getFile('docs/dashboard.md') ?? '').toContain('## Available dashboards');
      });

      it('is generated when only some includes entries are dashboards', () => {
        const context = makeContext({
          pluginJsonExtras: {
            includes: [
              { type: 'page', name: 'config', path: 'configurations.md' },
              { type: 'dashboard', name: 'overview', path: 'dashboards/overview.json' },
            ],
          },
        });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/dashboard.md')).toBe(true);
      });

      it('is skipped when includes has no dashboard entry', () => {
        const context = makeContext({
          pluginJsonExtras: {
            includes: [{ type: 'page', name: 'config', path: 'configurations.md' }],
          },
        });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/dashboard.md')).toBe(false);
      });

      it('is skipped when plugin.json has no includes array', () => {
        const context = makeContext();
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/dashboard.md')).toBe(false);
      });
    });

    describe('macros.md', () => {
      it('is generated when src contains a Go sqlds import', () => {
        const basePath = makeTempPluginDir({ 'datasource.go': 'import "github.com/grafana/sqlds/v3"\n' });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/macros.md')).toBe(true);
        expect(context.getFile('docs/macros.md') ?? '').toContain('## Available macros');
      });

      it('is generated when src contains an @grafana/sql import', () => {
        const basePath = makeTempPluginDir({
          'datasource.ts': 'import { SqlQueryEditorLazy } from "@grafana/sql";\n',
        });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/macros.md')).toBe(true);
      });

      it('is skipped when no SQL signal is present', () => {
        const basePath = makeTempPluginDir({ 'datasource.ts': 'export class DataSource {}\n' });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
        expect(context.doesFileExist('docs/macros.md')).toBe(false);
      });
    });
  });
});

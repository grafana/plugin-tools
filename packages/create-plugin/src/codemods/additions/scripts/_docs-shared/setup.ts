import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../../../context.js';
import { additionsDebug, addDependenciesToPackageJson } from '../../../utils.js';

// TODO: replace with stable tag once plugin-actions PR #219 merges
const REQUIRED_BUILD_PLUGIN_REF = 'eriksundell/plugin-docs-build-step';

export interface PluginJsonInclude {
  type?: string;
  name?: string;
  path?: string;
  [key: string]: unknown;
}

export interface PluginJson {
  type?: string;
  name?: string;
  docsPath?: string;
  annotations?: boolean;
  alerting?: boolean;
  backend?: boolean;
  includes?: PluginJsonInclude[];
  [key: string]: unknown;
}

export type ConditionalFilePredicate = (ctx: { pluginJson: PluginJson; basePath: string }) => boolean;

// supported agent loops. `none` disables all agent-related scaffolding.
export type AgentLoop = 'claude' | 'codex' | 'cursor' | 'none';

// maps each non-none loop to its conventional skills directory.
const LOOP_SKILL_TARGET: Record<Exclude<AgentLoop, 'none'>, string> = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  cursor: '.cursor/skills',
};

// the path under the codemod's agent/ template tree where the canonical
// (unrouted) skill files live. The codemod rewrites this prefix to the
// loop-specific directory at scaffold time.
const SKILLS_TEMPLATE_PREFIX = '.config/AGENTS/skills/';

// computes the destination path for an agent template file given the chosen
// loop. Skill files are rerouted from the codemod's internal canonical path to
// the loop's conventional skills directory. Everything else (docs/AGENTS.md
// today) passes through unchanged.
function targetPathForLoop(relPath: string, agentLoop: Exclude<AgentLoop, 'none'>): string | undefined {
  if (relPath.startsWith(SKILLS_TEMPLATE_PREFIX)) {
    return `${LOOP_SKILL_TARGET[agentLoop]}/${relPath.slice(SKILLS_TEMPLATE_PREFIX.length)}`;
  }
  return relPath;
}

export interface DocsSetupOptions {
  context: Context;
  docsPath: string;
  templateBaseUrl: URL;
  codemodName: string;
  conditionalFiles?: Record<string, ConditionalFilePredicate>;
  /**
   * Which AI agent loop to scaffold support for. Controls whether docs/AGENTS.md
   * and the per-loop skills are written.
   *
   * Defaults to `none` if omitted - in which case NO agent files are written
   * (including `docs/AGENTS.md` and any skills).
   *
   * The `agent/` template subtree maps to the target plugin like this:
   *   agent/docs/AGENTS.md                         -> docs/AGENTS.md
   *   agent/.config/AGENTS/skills/<name>/SKILL.md  -> <loop-skills-path>/<name>/SKILL.md
   */
  agentLoop?: AgentLoop;
}

export function setupDocsScaffolding(opts: DocsSetupOptions): Context {
  const { context, docsPath, templateBaseUrl, codemodName, conditionalFiles = {}, agentLoop = 'none' } = opts;

  // step 1: early exit if the docs directory already exists on disk
  if (existsSync(join(context.basePath, docsPath))) {
    throw new Error(
      `A directory already exists at '${docsPath}'. Re-run with a different path:\n  create-plugin add ${codemodName} --docsPath <alternative-path>`
    );
  }

  // step 2: set docsPath in src/plugin.json
  const pluginJsonContent = context.getFile('src/plugin.json');
  if (pluginJsonContent === undefined) {
    throw new Error('Cannot find src/plugin.json. Run this command from the plugin root directory.');
  }

  let pluginJson: PluginJson;
  try {
    pluginJson = JSON.parse(pluginJsonContent);
  } catch (e) {
    throw new Error(`Cannot parse src/plugin.json: ${e}`);
  }

  const existingDocsPath = pluginJson.docsPath;
  if (existingDocsPath !== undefined && existingDocsPath !== docsPath) {
    additionsDebug(`src/plugin.json already has docsPath set to '${existingDocsPath}', skipping update`);
  } else {
    context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));
  }

  const pluginName = pluginJson.name ?? 'my-plugin';

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '^0.0.10' });

  // step 4: add docs:serve and docs:validate npm scripts
  addDocsScripts(context);

  // step 5: copy template files to docs folder (includes README.txt)
  copyDocsTemplates(context, templateBaseUrl, docsPath, pluginName, pluginJson, conditionalFiles);

  // step 6: append the AI-workflow section to the docs README when an agent loop is selected
  if (agentLoop !== 'none') {
    appendAgentSuffixToReadme(context, docsPath, pluginName);
  }

  // step 7: copy validate-docs workflow from the shared templates folder (same dir as this file)
  upsertFile(context, '.github/workflows/validate-docs.yml', readSharedTemplate('workflows/validate-docs.yml'));

  // step 8: bump build-plugin version in release.yml
  bumpBuildPluginVersion(context);

  // step 9: optionally scaffold AI authoring assistance (AGENTS.md, skills)
  let agentAssistanceAdded = false;
  if (agentLoop !== 'none') {
    agentAssistanceAdded = copyAgentTemplates(context, templateBaseUrl, pluginName, agentLoop);
    if (agentAssistanceAdded) {
      appendMultiPageDocsSectionToInstructions(context, docsPath);
    }
  }

  // step 9: print next-steps summary
  const readmePresent = existsSync(join(context.basePath, 'README.md'));
  printNextSteps({ docsPath, agentAssistanceAdded, readmePresent, agentLoop });

  return context;
}

function printNextSteps(opts: {
  docsPath: string;
  agentAssistanceAdded: boolean;
  readmePresent: boolean;
  agentLoop: AgentLoop;
}): void {
  const { docsPath, agentAssistanceAdded, readmePresent, agentLoop } = opts;
  const lines = ['', 'Next steps:'];
  if (agentAssistanceAdded && readmePresent) {
    lines.push(
      `  - Ask an AI agent to run the \`bootstrap-plugin-docs\` skill - it will mine your README and source files into the new ${docsPath}/ stubs`
    );
  } else if (agentAssistanceAdded) {
    lines.push(
      `  - Ask an AI agent to run the \`write-plugin-docs\` skill on each stub under ${docsPath}/ (read ${docsPath}/AGENTS.md first)`
    );
  } else {
    lines.push(`  - Fill in the stub docs under ${docsPath}/ with your plugin's actual content`);
  }
  // the `agentLoop !== 'none'` check is required for TypeScript narrowing
  // (LOOP_SKILL_TARGET is keyed by Exclude<AgentLoop, 'none'>). At runtime
  // `agentAssistanceAdded` already implies a non-none loop.
  if (agentAssistanceAdded && agentLoop !== 'none') {
    lines.push(`  - Skills are available under ${LOOP_SKILL_TARGET[agentLoop]}/`);
  }
  lines.push('  - Run `npm run docs:serve` to preview the docs locally');
  lines.push('  - Run `npm run docs:validate` to check for issues before pushing');
  lines.push('');
  console.log(lines.join('\n'));
}

// throws a helpful error message when the user omits `--agent-loop`. Use this
// at the top of each codemod's entrypoint, before calling setupDocsScaffolding.
//
// Note: this is a manual check rather than a valibot schema constraint because
// valibot's `v.object` raises a generic "Invalid key: Expected X but received
// undefined" error for missing required fields that can't be customized at the
// field-schema level. Pairs with `agentLoop: v.optional(v.union(...))` in each
// codemod's schema (no default, just optional).
export function assertAgentLoop(loop: AgentLoop | undefined): asserts loop is AgentLoop {
  if (loop !== undefined) {
    return;
  }
  throw new Error(
    [
      'Missing required flag: --agent-loop',
      '',
      "This codemod can ship a set of AI skills that help author plugin docs and keep them aligned with Grafana's documentation standards.",
      '',
      'Pick how you want the skills wired up:',
      '  --agent-loop=claude   install skills under .claude/skills/   (Claude Code)',
      '  --agent-loop=codex    install skills under .agents/skills/    (OpenAI Codex)',
      '  --agent-loop=cursor   install skills under .cursor/skills/    (Cursor)',
      '  --agent-loop=none     skip the AI skills entirely (just scaffold the docs files)',
    ].join('\n')
  );
}

// parses src/plugin.json from the context and verifies its `type` matches the
// expected value. Throws a helpful error otherwise. Returns the parsed object
// so callers don't have to reparse.
export function assertPluginType(
  context: Context,
  opts: { expectedType: 'datasource' | 'panel'; codemodName: string }
): PluginJson {
  const raw = context.getFile('src/plugin.json');
  if (raw === undefined) {
    throw new Error('Cannot find src/plugin.json. Run this command from the plugin root directory.');
  }
  let parsed: PluginJson;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Cannot parse src/plugin.json: ${e}`);
  }
  if (parsed.type !== opts.expectedType) {
    const otherCommand = opts.expectedType === 'datasource' ? 'panel-docs' : 'datasource-docs';
    throw new Error(
      `create-plugin add ${opts.codemodName} only works on '${opts.expectedType}' plugins, but this plugin's type is '${parsed.type ?? 'unset'}'. Try create-plugin add ${otherCommand} if this is the other plugin type.`
    );
  }
  return parsed;
}

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const VARIABLE_SUPPORT_RE =
  /\b(?:CustomVariableSupport|StandardVariableSupport|DataSourceVariableSupport|metricFindQuery)\b/;

// scans the plugin's src/ tree for any of the four Grafana variable-support
// hooks (CustomVariableSupport, StandardVariableSupport, DataSourceVariableSupport
// or metricFindQuery). Returns true on the first match. Returns false if src/
// doesn't exist.
export function sourceContainsVariableSupport(basePath: string): boolean {
  const srcDir = join(basePath, 'src');
  if (!existsSync(srcDir)) {
    return false;
  }
  return walkForMatch(srcDir);
}

function walkForMatch(dir: string): boolean {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (walkForMatch(fullPath)) {
        return true;
      }
      continue;
    }
    if (!SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      continue;
    }
    const content = readFileSync(fullPath, 'utf-8');
    if (VARIABLE_SUPPORT_RE.test(content)) {
      return true;
    }
  }
  return false;
}

const SQL_SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.go'];
const SQL_PATTERNS = [
  // Go import of sqlds (any major version, with or without /vN suffix)
  /["']github\.com\/grafana\/sqlds(\/v\d+)?["']/,
  // TS/JS import of the shared SQL frontend library
  /from\s+["']@grafana\/sql["']/,
];

// detects whether the plugin source uses one of the shared SQL libraries
// (`github.com/grafana/sqlds` on the backend or `@grafana/sql` on the
// frontend). Walks both `src/` and `pkg/` since Go backend code is sometimes
// kept under `pkg/`. Returns true on the first match.
export function sourceIsSqlDatasource(basePath: string): boolean {
  for (const dir of ['src', 'pkg']) {
    const root = join(basePath, dir);
    if (!existsSync(root)) {
      continue;
    }
    if (walkForSqlMatch(root)) {
      return true;
    }
  }
  return false;
}

function walkForSqlMatch(dir: string): boolean {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (walkForSqlMatch(fullPath)) {
        return true;
      }
      continue;
    }
    if (!SQL_SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      continue;
    }
    const content = readFileSync(fullPath, 'utf-8');
    if (SQL_PATTERNS.some((re) => re.test(content))) {
      return true;
    }
  }
  return false;
}

function copyDocsTemplates(
  context: Context,
  templateBaseUrl: URL,
  docsPath: string,
  pluginName: string,
  pluginJson: PluginJson,
  conditionalFiles: Record<string, ConditionalFilePredicate>
): void {
  const docsTemplateDir = fileURLToPath(new URL('./docs', templateBaseUrl));
  if (!existsSync(docsTemplateDir)) {
    return;
  }
  for (const filePath of listFilesRecursively(docsTemplateDir)) {
    const relativePath = filePath.slice(docsTemplateDir.length + 1);
    const targetPath = `${docsPath}/${relativePath}`;
    const predicate = conditionalFiles[basename(filePath)];
    if (predicate && !predicate({ pluginJson, basePath: context.basePath })) {
      additionsDebug(`${targetPath} skipped: plugin does not meet the conditions for this file`);
      continue;
    }
    if (!context.doesFileExist(targetPath)) {
      const content = readFileSync(filePath, 'utf-8').replaceAll('{{pluginName}}', pluginName);
      context.addFile(targetPath, content);
    } else {
      additionsDebug(`${targetPath} already exists, skipping`);
    }
  }
}

function listFilesRecursively(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    return entry.isDirectory() ? listFilesRecursively(fullPath) : [fullPath];
  });
}

function upsertFile(context: Context, path: string, content: string): void {
  if (context.doesFileExist(path)) {
    context.updateFile(path, content);
  } else {
    context.addFile(path, content);
  }
}

function readSharedTemplate(relativePath: string): string {
  const templatePath = fileURLToPath(new URL(`./templates/${relativePath}`, import.meta.url));
  return readFileSync(templatePath, 'utf-8');
}

// appends the shared AI-workflow suffix to the docs README. No-op if the
// README is missing from Context (e.g. a codemod chose not to scaffold one)
// or if the suffix is already present.
function appendAgentSuffixToReadme(context: Context, docsPath: string, pluginName: string): void {
  const readmePath = `${docsPath}/README.txt`;
  const existing = context.getFile(readmePath);
  if (existing === undefined) {
    additionsDebug(`${readmePath} not found in context; skipping agent-workflow suffix`);
    return;
  }
  const suffix = readSharedTemplate('README-suffix.txt').replaceAll('{{pluginName}}', pluginName);
  if (existing.includes('AI authoring assistance')) {
    additionsDebug(`${readmePath} already contains the AI authoring section, skipping`);
    return;
  }
  const trailingNewline = existing.endsWith('\n') ? '' : '\n';
  context.updateFile(readmePath, `${existing}${trailingNewline}${suffix}`);
}

function bumpBuildPluginVersion(context: Context): void {
  const releaseYmlContent = context.getFile('.github/workflows/release.yml');
  if (!releaseYmlContent) {
    additionsDebug('no .github/workflows/release.yml found, skipping build-plugin version bump');
    return;
  }
  const updated = releaseYmlContent.replace(
    /(grafana\/plugin-actions\/build-plugin@)[^\s'"]+/g,
    `$1${REQUIRED_BUILD_PLUGIN_REF}`
  );
  if (updated === releaseYmlContent) {
    additionsDebug('no grafana/plugin-actions/build-plugin reference found in release.yml, skipping');
    return;
  }
  context.updateFile('.github/workflows/release.yml', updated);
}

// scaffolds AI authoring assistance: docs/AGENTS.md plus the four skills under
// the loop-specific skills path (.claude/skills/, .agents/skills/ or
// .cursor/skills/). Skill files are stored under .config/AGENTS/skills/ in the
// codemod's internal template tree and get re-routed to the loop's
// conventional path at scaffold time.
//
// Reads from TWO template directories:
//   1. The codemod-specific `<templateBaseUrl>/agent/` (plugin-type-specific
//      skills like bootstrap-plugin-docs, plus any per-codemod overrides).
//   2. The shared `_docs-shared/templates/agent/` (the generic AGENTS.md and
//      the type-agnostic skills: write-plugin-docs, review-plugin-docs,
//      validate-plugin-docs).
//
// Codemod-specific files win when both directories contain the same path,
// since we iterate the codemod-specific dir first and refuse to overwrite
// existing Context entries.
//
// returns true if at least one file was written. existing files are never
// overwritten - the user may have customized them.
function copyAgentTemplates(
  context: Context,
  templateBaseUrl: URL,
  pluginName: string,
  agentLoop: Exclude<AgentLoop, 'none'>
): boolean {
  const codemodAgentDir = fileURLToPath(new URL('./agent', templateBaseUrl));
  const sharedAgentDir = fileURLToPath(new URL('./templates/agent', import.meta.url));
  let wroteSomething = false;
  for (const agentTemplateDir of [codemodAgentDir, sharedAgentDir]) {
    if (!existsSync(agentTemplateDir)) {
      continue;
    }
    for (const filePath of listFilesRecursively(agentTemplateDir)) {
      const relPath = filePath.slice(agentTemplateDir.length + 1);
      const targetPath = targetPathForLoop(relPath, agentLoop);
      if (targetPath === undefined) {
        continue;
      }
      if (context.doesFileExist(targetPath)) {
        additionsDebug(`${targetPath} already exists, skipping`);
        continue;
      }
      const content = readFileSync(filePath, 'utf-8').replaceAll('{{pluginName}}', pluginName);
      context.addFile(targetPath, content);
      wroteSomething = true;
    }
  }
  return wroteSomething;
}

const MULTI_PAGE_DOCS_MARKER = '## Multi-page docs';

// appends a "Multi-page docs" section to the plugin's
// .config/AGENTS/instructions.md so agents working on src/ remember to keep
// docs in sync. idempotent - if the section is already there, does nothing.
function appendMultiPageDocsSectionToInstructions(context: Context, docsPath: string): void {
  const targetPath = '.config/AGENTS/instructions.md';
  const existing = context.getFile(targetPath);
  if (existing === undefined) {
    additionsDebug(`${targetPath} not found; skipping multi-page docs section append`);
    return;
  }
  if (existing.includes(MULTI_PAGE_DOCS_MARKER)) {
    additionsDebug(`${targetPath} already contains a Multi-page docs section, skipping`);
    return;
  }
  const trailingNewline = existing.endsWith('\n') ? '' : '\n';
  const appended = `${existing}${trailingNewline}\n${MULTI_PAGE_DOCS_MARKER}\n\nThis plugin uses multi-page docs in \`${docsPath}/\`. Read \`${docsPath}/AGENTS.md\` before authoring or editing pages.\n\n- Docs and source can drift apart if one changes without the other. When modifying a file under \`src/\`, check whether the pages under \`${docsPath}/\` still describe the file accurately and update them in the same change.\n- Four Agent Skills cover the docs workflows: \`bootstrap-plugin-docs\` (one-shot brownfield migration), \`write-plugin-docs\` (per-page authoring), \`review-plugin-docs\` (plugin-specific review), \`validate-plugin-docs\` (validate → fix loop). They are scaffolded under your agent loop's skills folder (\`.claude/skills/\`, \`.agents/skills/\` or \`.cursor/skills/\`).\n`;
  context.updateFile(targetPath, appended);
}

function addDocsScripts(context: Context): void {
  const packageJsonContent = context.getFile('package.json');
  if (!packageJsonContent) {
    return;
  }
  const packageJson = JSON.parse(packageJsonContent) as Record<string, unknown>;
  const scripts = (packageJson['scripts'] ?? {}) as Record<string, string>;
  let changed = false;

  if (!scripts['docs:serve']) {
    scripts['docs:serve'] = 'plugin-docs-cli serve --port 3001 --reload';
    changed = true;
  } else {
    additionsDebug('docs:serve already exists in package.json scripts, skipping');
  }

  if (!scripts['docs:validate']) {
    scripts['docs:validate'] = 'plugin-docs-cli validate --strict';
    changed = true;
  } else {
    additionsDebug('docs:validate already exists in package.json scripts, skipping');
  }

  if (changed) {
    context.updateFile('package.json', JSON.stringify({ ...packageJson, scripts }, null, 2));
  }
}

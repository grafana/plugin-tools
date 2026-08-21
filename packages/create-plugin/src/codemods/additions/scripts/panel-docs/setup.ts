import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../../../context.js';
import { output } from '../../../../utils/utils.console.js';
import { additionsDebug, addDependenciesToPackageJson, isVersionGreater } from '../../../utils.js';

const REQUIRED_BUILD_PLUGIN_REF = 'build-plugin/v1.2.0';

// supported agent loops. `none` disables all agent-related scaffolding.
export type AgentLoop = 'claude' | 'codex' | 'cursor' | 'none';

// maps each non-none loop to its conventional skills directory.
const LOOP_SKILL_TARGET: Record<Exclude<AgentLoop, 'none'>, string> = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  cursor: '.cursor/skills',
};

// canonical prefixes under the codemod's agent/ template tree. Both get
// rewritten at scaffold time:
//   - SKILLS_TEMPLATE_PREFIX (`.config/AGENTS/skills/`) -> the loop-specific
//     skills directory (`.claude/skills/`, `.agents/skills/`, `.cursor/skills/`)
//   - DOCS_TEMPLATE_PREFIX (`docs/`) -> the user's chosen `<docsPath>/`. Without
//     this rewrite, a non-default docsPath (e.g. `docs2`) ends up with the
//     agent's docs/AGENTS.md scaffolded into a stray `docs/` folder while the
//     actual pages live in `docs2/`.
const SKILLS_TEMPLATE_PREFIX = '.config/AGENTS/skills/';
const DOCS_TEMPLATE_PREFIX = 'docs/';

// computes the destination path for an agent template file given the chosen
// loop and the user's docsPath. Two prefixes are rewritten; anything else
// passes through unchanged.
function targetPathForLoop(relPath: string, agentLoop: Exclude<AgentLoop, 'none'>, docsPath: string): string {
  if (relPath.startsWith(SKILLS_TEMPLATE_PREFIX)) {
    return `${LOOP_SKILL_TARGET[agentLoop]}/${relPath.slice(SKILLS_TEMPLATE_PREFIX.length)}`;
  }
  if (relPath.startsWith(DOCS_TEMPLATE_PREFIX)) {
    return `${docsPath}/${relPath.slice(DOCS_TEMPLATE_PREFIX.length)}`;
  }
  return relPath;
}

const MULTI_PAGE_DOCS_MARKER = '## Multi-page docs';

export interface PluginJson {
  type?: string;
  name?: string;
  docsPath?: string;
  [key: string]: unknown;
}

export interface DocsSetupOptions {
  context: Context;
  docsPath: string;
  templateBaseUrl: URL;
  codemodName: string;
  /**
   * Which AI agent loop to scaffold support for. Controls whether docs/AGENTS.md
   * and the per-loop skills are written.
   *
   * Defaults to `none` if omitted - in which case NO agent files are written
   * (including `docs/AGENTS.md` and any skills).
   *
   * The `agent/` template subtree maps to the target plugin like this:
   *   agent/docs/AGENTS.md                         -> <docsPath>/AGENTS.md
   *   agent/.config/AGENTS/skills/<name>/SKILL.md  -> <loop-skills-path>/<name>/SKILL.md
   */
  agentLoop?: AgentLoop;
}

export function setupDocsScaffolding(opts: DocsSetupOptions): Context {
  const { context, docsPath, templateBaseUrl, codemodName, agentLoop = 'none' } = opts;

  // step 1: early exit if the docs directory already exists on disk
  if (existsSync(join(context.basePath, docsPath))) {
    throw new Error(
      `A directory already exists at '${docsPath}'. Re-run with a different path:\n  create-plugin add ${codemodName} --docsPath <alternative-path>`
    );
  }

  // step 2: set docsPath in src/plugin.json
  const pluginJson = readPluginJson(context);

  const existingDocsPath = pluginJson.docsPath;
  if (existingDocsPath !== undefined && existingDocsPath !== docsPath) {
    throw new Error(
      `src/plugin.json already has docsPath set to '${existingDocsPath}'.\n  Re-run with the existing path:\n  create-plugin add ${codemodName} --docsPath ${existingDocsPath}`
    );
  }
  context.updateFile('src/plugin.json', JSON.stringify({ ...pluginJson, docsPath }, null, 2));

  const pluginName = pluginJson.name ?? 'my-plugin';

  // step 3: add @grafana/plugin-docs-cli as a devDependency
  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-docs-cli': '^0.2.1' });

  // step 4: add docs:serve and docs:validate npm scripts
  addDocsScripts(context);

  // step 5: copy template files to docs folder (includes README.md)
  copyDocsTemplates(context, templateBaseUrl, docsPath, pluginName);

  // append the AI-workflow section to the docs README when an agent loop is selected
  if (agentLoop !== 'none') {
    appendAgentSuffixToReadme(context, templateBaseUrl, docsPath, pluginName);
  }

  // step 6: copy validate-docs workflow, unless the user already customized one
  const workflowPath = '.github/workflows/validate-docs.yml';
  if (!context.doesFileExist(workflowPath)) {
    const workflowContent = readTemplate(templateBaseUrl, 'workflows/validate-docs.yml').replaceAll(
      '{{docsPath}}',
      docsPath
    );
    context.addFile(workflowPath, workflowContent);
  } else {
    additionsDebug(`${workflowPath} already exists, skipping`);
  }

  // step 7: bump build-plugin version in release.yml
  bumpBuildPluginVersion(context);

  // optionally scaffold AI authoring assistance (AGENTS.md, skills)
  let agentAssistanceAdded = false;
  if (agentLoop !== 'none') {
    agentAssistanceAdded = copyAgentTemplates(context, templateBaseUrl, pluginName, agentLoop, docsPath);
    if (agentAssistanceAdded) {
      appendMultiPageDocsSectionToInstructions(context, docsPath);
    }
  }

  // step 8: print next-steps summary
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
  const body: string[] = [];
  // the `agentLoop !== 'none'` check narrows the type for LOOP_SKILL_TARGET below.
  // At runtime `agentAssistanceAdded` already implies a non-none loop.
  if (agentAssistanceAdded && agentLoop !== 'none') {
    const readmeMention = readmePresent ? ' (and mine your README for content)' : '';
    body.push(`Run the \`/bootstrap-plugin-docs\` skill to generate docs for your current features${readmeMention}`);
    body.push(`Skills are available under ${LOOP_SKILL_TARGET[agentLoop]}/`);
  } else {
    body.push(`Fill in the stub docs under ${docsPath}/ with your plugin's actual content`);
  }
  body.push('Run `npm run docs:serve` to preview the docs locally');
  body.push('Run `npm run docs:validate` to check for issues before pushing');
  output.log({ title: 'Next steps', body });
}

// throws a helpful error message when the user omits `--agent-loop`. Use this
// at the top of the codemod's entrypoint, before calling setupDocsScaffolding.
//
// Note: this is a manual check rather than a valibot schema constraint because
// valibot's `v.object` raises a generic "Invalid key: Expected X but received
// undefined" error for missing required fields that can't be customized at the
// field-schema level. Pairs with `agentLoop: v.optional(v.union(...))` in the
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

// reads and parses src/plugin.json, throwing a helpful error if it's missing,
// unparseable, or not a plain object (e.g. `null`, an array, a bare string -
// all valid JSON, none of them a usable plugin.json).
function readPluginJson(context: Context): PluginJson {
  const raw = context.getFile('src/plugin.json');
  if (raw === undefined) {
    throw new Error('Cannot find src/plugin.json. Run this command from the plugin root directory.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Cannot parse src/plugin.json: ${e}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('src/plugin.json does not contain a JSON object.');
  }
  return parsed as PluginJson;
}

// verifies plugin.json's `type` matches the expected value. Throws a helpful
// error otherwise.
export function assertPluginType(
  context: Context,
  opts: { expectedType: 'datasource' | 'panel'; codemodName: string }
): PluginJson {
  const parsed = readPluginJson(context);
  if (parsed.type !== opts.expectedType) {
    const otherCommand = opts.expectedType === 'datasource' ? 'panel-docs' : 'datasource-docs';
    throw new Error(
      `create-plugin add ${opts.codemodName} only works on '${opts.expectedType}' plugins, but this plugin's type is '${parsed.type ?? 'unset'}'. Try create-plugin add ${otherCommand} if this is the other plugin type.`
    );
  }
  return parsed;
}

function copyDocsTemplates(context: Context, templateBaseUrl: URL, docsPath: string, pluginName: string): void {
  const docsTemplateDir = fileURLToPath(new URL('./docs', templateBaseUrl));
  if (!existsSync(docsTemplateDir)) {
    throw new Error(
      `Cannot find docs templates at ${docsTemplateDir}. This is a bug in @grafana/create-plugin - please report it.`
    );
  }
  for (const filePath of listFilesRecursively(docsTemplateDir)) {
    const relativePath = filePath.slice(docsTemplateDir.length + 1);
    const targetPath = `${docsPath}/${relativePath}`;
    if (!context.doesFileExist(targetPath)) {
      const content = readFileSync(filePath, 'utf-8').replaceAll('{{pluginName}}', pluginName);
      context.addFile(targetPath, content);
    } else {
      additionsDebug(`${targetPath} already exists, skipping`);
    }
  }
}

// scaffolds AI authoring assistance: docs/AGENTS.md plus the four skills under
// the loop-specific skills path (.claude/skills/, .agents/skills/ or
// .cursor/skills/). Skill files are stored under .config/AGENTS/skills/ in the
// codemod's internal template tree and get re-routed to the loop's
// conventional path at scaffold time.
//
// returns true if at least one file was written. Existing files are never
// overwritten - the user may have customized them.
function copyAgentTemplates(
  context: Context,
  templateBaseUrl: URL,
  pluginName: string,
  agentLoop: Exclude<AgentLoop, 'none'>,
  docsPath: string
): boolean {
  const agentTemplateDir = fileURLToPath(new URL('./agent', templateBaseUrl));
  if (!existsSync(agentTemplateDir)) {
    throw new Error(
      `Cannot find agent templates at ${agentTemplateDir}. This is a bug in @grafana/create-plugin - please report it.`
    );
  }
  let wroteSomething = false;
  for (const filePath of listFilesRecursively(agentTemplateDir)) {
    const relPath = filePath.slice(agentTemplateDir.length + 1);
    const targetPath = targetPathForLoop(relPath, agentLoop, docsPath);
    if (context.doesFileExist(targetPath)) {
      additionsDebug(`${targetPath} already exists, skipping`);
      continue;
    }
    const content = readFileSync(filePath, 'utf-8').replaceAll('{{pluginName}}', pluginName);
    context.addFile(targetPath, content);
    wroteSomething = true;
  }
  return wroteSomething;
}

// appends the AI-workflow suffix to the docs README. No-op if the README is
// missing from Context or if the suffix is already present.
function appendAgentSuffixToReadme(context: Context, templateBaseUrl: URL, docsPath: string, pluginName: string): void {
  const readmePath = `${docsPath}/README.md`;
  const existing = context.getFile(readmePath);
  if (existing === undefined) {
    additionsDebug(`${readmePath} not found in context; skipping agent-workflow suffix`);
    return;
  }
  if (existing.includes('AI authoring assistance')) {
    additionsDebug(`${readmePath} already contains the AI authoring section, skipping`);
    return;
  }
  const suffix = readTemplate(templateBaseUrl, 'README-suffix.md').replaceAll('{{pluginName}}', pluginName);
  const trailingNewline = existing.endsWith('\n') ? '' : '\n';
  context.updateFile(readmePath, `${existing}${trailingNewline}${suffix}`);
}

function listFilesRecursively(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    return entry.isDirectory() ? listFilesRecursively(fullPath) : [fullPath];
  });
}

function readTemplate(templateBaseUrl: URL, relativePath: string): string {
  const templatePath = fileURLToPath(new URL(relativePath, templateBaseUrl));
  return readFileSync(templatePath, 'utf-8');
}

// appends a "Multi-page docs" section to the plugin's
// .config/AGENTS/instructions.md so agents working on src/ remember to keep
// docs in sync. Idempotent - if the section is already there, or the file
// doesn't exist in the Context, does nothing.
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
  const section = [
    MULTI_PAGE_DOCS_MARKER,
    '',
    `This plugin uses multi-page docs under \`${docsPath}/\`. **Always update those pages when features change in \`src/\` (added, changed or removed).** Conventions, the feature-change checklist and the four authoring skills are in [\`${docsPath}/AGENTS.md\`](./${docsPath}/AGENTS.md).`,
    '',
  ].join('\n');
  context.updateFile(targetPath, `${existing}${trailingNewline}\n${section}`);
}

// matches an anchored `uses: grafana/plugin-actions/build-plugin@<ref>` line,
// capturing the prefix (for reassembly) and the existing ref (to compare
// versions before overwriting it).
const BUILD_PLUGIN_USES_RE = /(uses:\s*grafana\/plugin-actions\/build-plugin@)([^\s'"]+)/g;
// matches the version out of either a bare `vX.Y.Z` tag or a `build-plugin/vX.Y.Z`
// tag - the two ref shapes this codemod and its templates actually use.
const BUILD_PLUGIN_TAG_RE = /^(?:build-plugin\/)?v(\d+\.\d+\.\d+)$/;

function bumpBuildPluginVersion(context: Context): void {
  const releaseYmlContent = context.getFile('.github/workflows/release.yml');
  if (!releaseYmlContent) {
    additionsDebug('no .github/workflows/release.yml found, skipping build-plugin version bump');
    return;
  }

  let matched = false;
  const requiredVersion = BUILD_PLUGIN_TAG_RE.exec(REQUIRED_BUILD_PLUGIN_REF)?.[1];
  const updated = releaseYmlContent.replace(BUILD_PLUGIN_USES_RE, (fullMatch, prefix: string, existingRef: string) => {
    matched = true;
    const existingVersion = BUILD_PLUGIN_TAG_RE.exec(existingRef)?.[1];
    // only skip the bump when both refs parse as versions and the existing one
    // is already at least as new - an unparseable ref (a branch, a SHA) always
    // gets normalized to the required tag.
    if (existingVersion && requiredVersion && !isVersionGreater(requiredVersion, existingVersion, false)) {
      additionsDebug(
        `release.yml already pins build-plugin@${existingRef}, which is not older than ${REQUIRED_BUILD_PLUGIN_REF}, skipping`
      );
      return fullMatch;
    }
    return `${prefix}${REQUIRED_BUILD_PLUGIN_REF}`;
  });

  if (!matched) {
    additionsDebug('no grafana/plugin-actions/build-plugin reference found in release.yml, skipping');
    return;
  }
  if (updated === releaseYmlContent) {
    additionsDebug('release.yml build-plugin reference(s) already up to date, skipping');
    return;
  }
  context.updateFile('.github/workflows/release.yml', updated);
}

function addDocsScripts(context: Context): void {
  const packageJsonContent = context.getFile('package.json');
  if (!packageJsonContent) {
    return;
  }
  let packageJson: Record<string, unknown>;
  try {
    packageJson = JSON.parse(packageJsonContent);
  } catch (e) {
    throw new Error(`Cannot parse package.json: ${e}`);
  }
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

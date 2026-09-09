import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../context.js';
import { output } from '../../utils/utils.console.js';
import { additionsDebug, addDependenciesToPackageJson, isVersionGreater } from '../utils.js';

const REQUIRED_BUILD_PLUGIN_REF = 'build-plugin/v1.2.0';

const DOCS_INSTRUCTIONS_MARKER = 'before writing or modifying plugin documentation';

// Skills have to be written once per agent, because no agent reads another's
// directory and SKILL.md supports no include mechanism - Claude Code ignores
// the `@import` syntax that works in CLAUDE.md, and a SKILL.md whose first line
// isn't `---` is treated as literal content rather than parsed for frontmatter.
// So each destination gets a complete, self-contained copy of the same template.
//
// `.agents/skills/` is the cross-agent path (Codex, Cursor, Copilot, Gemini CLI
// and Amp all read it), which is why there is no separate `.codex/skills/` copy.
const SKILLS_TEMPLATE_PREFIX = 'skills/';
const SKILL_TARGET_DIRS = ['.claude/skills', '.agents/skills'];

export interface PluginJson {
  type?: string;
  name?: string;
  docsPath?: string;
  [key: string]: unknown;
}

export interface DocsSetupOptions {
  context: Context;
  docsPath: string;
  /** Templates specific to this plugin type, under `templates/docs/<type>/`. */
  templateBaseUrl: URL;
  /** Templates shared by every plugin type, under `templates/docs/common/`. */
  commonTemplateBaseUrl: URL;
  codemodName: string;
  /**
   * Whether to scaffold the docs authoring guide and the bootstrap skill.
   * Defaults to true; `--no-agents` turns it off.
   *
   * The `agent/` template subtree mirrors its destination, except `skills/`
   * which fans out to every agent's skills directory:
   *   agent/.config/AGENTS/plugin-docs.md  -> .config/AGENTS/plugin-docs.md
   *   agent/skills/<name>/SKILL.md         -> .claude/skills/<name>/SKILL.md
   *                                        -> .agents/skills/<name>/SKILL.md
   */
  agents?: boolean;
}

export function setupDocsScaffolding(opts: DocsSetupOptions): Context {
  const { context, docsPath, templateBaseUrl, commonTemplateBaseUrl, codemodName, agents = true } = opts;

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

  // append the AI-workflow section to the docs README
  if (agents) {
    appendAgentSuffixToReadme(context, templateBaseUrl, docsPath, pluginName);
  }

  // step 6: copy validate-docs workflow, unless the user already customized one
  const workflowPath = '.github/workflows/validate-docs.yml';
  if (!context.doesFileExist(workflowPath)) {
    const workflowContent = readTemplate(commonTemplateBaseUrl, 'workflows/validate-docs.yml').replaceAll(
      '{{docsPath}}',
      docsPath
    );
    context.addFile(workflowPath, workflowContent);
  } else {
    additionsDebug(`${workflowPath} already exists, skipping`);
  }

  // step 7: bump build-plugin version in release.yml
  bumpBuildPluginVersion(context);

  // step 8: scaffold the docs authoring guide and bootstrap skill
  let agentAssistanceAdded = false;
  let instructionsPointerAdded = false;
  if (agents) {
    agentAssistanceAdded = copyAgentTemplates(context, templateBaseUrl, pluginName, docsPath);
    if (agentAssistanceAdded) {
      instructionsPointerAdded = appendDocsPointerToInstructions(context, docsPath);
    }
  }

  // step 9: print next-steps summary
  const readmePresent = existsSync(join(context.basePath, 'README.md'));
  printNextSteps({ docsPath, agentAssistanceAdded, instructionsPointerAdded, readmePresent });

  return context;
}

function printNextSteps(opts: {
  docsPath: string;
  agentAssistanceAdded: boolean;
  instructionsPointerAdded: boolean;
  readmePresent: boolean;
}): void {
  const { docsPath, agentAssistanceAdded, instructionsPointerAdded, readmePresent } = opts;
  const body: string[] = [];
  if (agentAssistanceAdded) {
    const readmeMention = readmePresent ? ' (and mine your README for content)' : '';
    body.push(`Run the \`/bootstrap-plugin-docs\` skill to draft docs for your current features${readmeMention}`);
    body.push(
      'Authoring conventions live in .config/AGENTS/plugin-docs.md - your coding agent reads them automatically'
    );
    if (!instructionsPointerAdded) {
      body.push(
        'No .config/AGENTS/instructions.md found, so nothing points at .config/AGENTS/plugin-docs.md - reference it from your own agent instructions'
      );
    }
  } else {
    body.push(`Fill in the stub docs under ${docsPath}/ with your plugin's actual content`);
  }
  body.push('Run `npm run docs:serve` to preview the docs locally');
  body.push('Run `npm run docs:validate` to check for issues before pushing');
  output.log({ title: 'Next steps', body });
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

// scaffolds the docs authoring guide (.config/AGENTS/plugin-docs.md, reached
// from instructions.md) plus the bootstrap skill, copied to each agent's skills
// directory.
//
// The guide deliberately lives outside <docsPath>: anything inside it is treated
// as a publishable page by `plugin-docs-cli validate`.
//
// returns true if at least one file was written. Existing files are never
// overwritten - the user may have customized them.
function copyAgentTemplates(context: Context, templateBaseUrl: URL, pluginName: string, docsPath: string): boolean {
  const agentTemplateDir = fileURLToPath(new URL('./agent', templateBaseUrl));
  if (!existsSync(agentTemplateDir)) {
    throw new Error(
      `Cannot find agent templates at ${agentTemplateDir}. This is a bug in @grafana/create-plugin - please report it.`
    );
  }
  let wroteSomething = false;
  for (const filePath of listFilesRecursively(agentTemplateDir)) {
    const relPath = filePath.slice(agentTemplateDir.length + 1);
    const content = readFileSync(filePath, 'utf-8')
      .replaceAll('{{pluginName}}', pluginName)
      .replaceAll('{{docsPath}}', docsPath);
    const targetPaths = relPath.startsWith(SKILLS_TEMPLATE_PREFIX)
      ? SKILL_TARGET_DIRS.map((dir) => `${dir}/${relPath.slice(SKILLS_TEMPLATE_PREFIX.length)}`)
      : [relPath];

    for (const targetPath of targetPaths) {
      if (context.doesFileExist(targetPath)) {
        additionsDebug(`${targetPath} already exists, skipping`);
        continue;
      }
      context.addFile(targetPath, content);
      wroteSomething = true;
    }
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

// points the plugin's existing agent instructions at the docs authoring guide,
// mirroring how instructions.md already points at .config/AGENTS/e2e-testing.md.
// Root AGENTS.md, CLAUDE.md and GEMINI.md all import instructions.md, so this
// single line is what makes the guide reachable from every agent - Claude Code
// in particular never reads AGENTS.md directly.
//
// Returns true when the pointer is present afterwards. Idempotent, and a no-op
// when the plugin predates the .config/AGENTS convention.
function appendDocsPointerToInstructions(context: Context, docsPath: string): boolean {
  const targetPath = '.config/AGENTS/instructions.md';
  const existing = context.getFile(targetPath);
  if (existing === undefined) {
    additionsDebug(`${targetPath} not found; skipping docs guide pointer`);
    return false;
  }
  if (existing.includes(DOCS_INSTRUCTIONS_MARKER)) {
    additionsDebug(`${targetPath} already points at the docs guide, skipping`);
    return true;
  }
  const trailingNewline = existing.endsWith('\n') ? '' : '\n';
  const line = `- This plugin ships multi-page docs under \`${docsPath}/\`. Keep them in sync when features change in \`src/\`. Read @./.config/AGENTS/plugin-docs.md ${DOCS_INSTRUCTIONS_MARKER}.\n`;
  context.updateFile(targetPath, `${existing}${trailingNewline}${line}`);
  return true;
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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Context } from './context.js';
import { renderHandlebarsTemplate } from '../utils/utils.handlebars.js';
import { additionsDebug } from './utils.js';

export const AGENT_INSTRUCTIONS_PATH = '.config/AGENTS/instructions.md';

const ROOT_AGENT_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];
// matches the pointer line in templates/common/{AGENTS,CLAUDE,GEMINI}.md
const INSTRUCTIONS_POINTER = `## Project knowledge\nThis repository contains a **Grafana plugin**. You must Read @./${AGENT_INSTRUCTIONS_PATH} before doing changes.\n`;

/**
 * Creates the missing root agent files. Appends a pointer to the instructions to any existing one that
 * doesn't reach them, and returns those files.
 */
export function ensureRootAgentFiles(context: Context, templateDir: string): string[] {
  const existing = ROOT_AGENT_FILES.filter((file) => context.doesFileExist(file));
  for (const file of ROOT_AGENT_FILES) {
    if (!existing.includes(file)) {
      context.addFile(file, readFileSync(join(templateDir, file), 'utf-8'));
    }
  }

  const reachesInstructions = (file: string): boolean => {
    const content = context.getFile(file) ?? '';
    if (content.includes(AGENT_INSTRUCTIONS_PATH)) {
      return true;
    }
    // `@AGENTS.md` or `./AGENTS.md`, but not `docs/AGENTS.md`
    return file !== 'AGENTS.md' && /(^|[\s@(])(\.\/)?AGENTS\.md/m.test(content) && reachesInstructions('AGENTS.md');
  };

  const linked: string[] = [];
  for (const file of existing) {
    if (reachesInstructions(file)) {
      continue;
    }
    const content = context.getFile(file) ?? '';
    context.updateFile(file, `${content.trimEnd()}\n\n${INSTRUCTIONS_POINTER}`);
    linked.push(file);
  }
  return linked;
}

/**
 * Creates the given `.config/AGENTS/` files, only when `instructions.md` is missing. They import each
 * other, so a plugin with its own instructions keeps what it has.
 */
export function ensureConfigAgentFiles(
  context: Context,
  templateDir: string,
  files: string[],
  data: Record<string, unknown>
) {
  if (context.doesFileExist(AGENT_INSTRUCTIONS_PATH)) {
    return;
  }
  for (const file of files) {
    const targetPath = `.config/AGENTS/${file}`;
    if (context.doesFileExist(targetPath)) {
      additionsDebug(`${targetPath} already exists, skipping`);
      continue;
    }
    const template = readFileSync(join(templateDir, targetPath), 'utf-8');
    context.addFile(targetPath, renderHandlebarsTemplate(template, data));
  }
}

/** Appends `text` to the agent instructions, unless they're missing or already contain `marker`. */
export function appendToAgentInstructions(context: Context, marker: string, text: string, separator = '\n\n') {
  const existing = context.getFile(AGENT_INSTRUCTIONS_PATH);
  if (existing === undefined) {
    additionsDebug(`Could not find ${AGENT_INSTRUCTIONS_PATH}, skipping`);
    return;
  }
  if (existing.includes(marker)) {
    additionsDebug(`${AGENT_INSTRUCTIONS_PATH} already contains ${marker}, skipping`);
    return;
  }
  const kept = existing.trimEnd();
  context.updateFile(AGENT_INSTRUCTIONS_PATH, kept ? `${kept}${separator}${text}` : text);
}

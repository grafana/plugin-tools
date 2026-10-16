import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Context } from './context.js';
import { addTemplateFolder, codemodsDebug } from './utils.js';

export const AGENT_INSTRUCTIONS_PATH = '.config/AGENTS/instructions.md';

const ROOT_AGENT_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];
// matches the pointer line in templates/common/{AGENTS,CLAUDE,GEMINI}.md
export const INSTRUCTIONS_POINTER = `## Project knowledge\nThis repository contains a **Grafana plugin**. You must Read @./${AGENT_INSTRUCTIONS_PATH} before doing changes.\n`;
const IMPORTS_INSTRUCTIONS = /@(\.\/)?\.config\/AGENTS\/instructions\.md/;
const IMPORTS_AGENTS_MD = /(^|\s)@(\.\/)?AGENTS\.md\b/m;

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

  // Claude and Gemini only follow `@` imports, while Codex reads AGENTS.md as text, so a mention is enough there
  const reachesInstructions = (file: string): boolean => {
    const content = context.getFile(file) ?? '';
    if (file === 'AGENTS.md') {
      return content.includes(AGENT_INSTRUCTIONS_PATH);
    }
    return IMPORTS_INSTRUCTIONS.test(content) || (IMPORTS_AGENTS_MD.test(content) && reachesInstructions('AGENTS.md'));
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
 * other, so a plugin with its own instructions keeps what it has. Returns the paths it added.
 */
export function ensureConfigAgentFiles(
  context: Context,
  templateDir: string,
  files: string[],
  data: Record<string, unknown>
): string[] {
  if (context.doesFileExist(AGENT_INSTRUCTIONS_PATH)) {
    return [];
  }
  return addTemplateFolder(context, {
    folderPath: join(templateDir, '.config', 'AGENTS'),
    targetPath: '.config/AGENTS',
    data,
    include: (file) => files.includes(file),
  });
}

/** Appends `text` to the agent instructions, unless they're missing or already contain `marker`. */
export function appendToAgentInstructions(context: Context, marker: string, text: string, separator = '\n\n') {
  const existing = context.getFile(AGENT_INSTRUCTIONS_PATH);
  if (existing === undefined) {
    codemodsDebug(`Could not find ${AGENT_INSTRUCTIONS_PATH}, skipping`);
    return;
  }
  if (existing.includes(marker)) {
    codemodsDebug(`${AGENT_INSTRUCTIONS_PATH} already contains ${marker}, skipping`);
    return;
  }
  const kept = existing.trimEnd();
  context.updateFile(AGENT_INSTRUCTIONS_PATH, kept ? `${kept}${separator}${text}` : text);
}

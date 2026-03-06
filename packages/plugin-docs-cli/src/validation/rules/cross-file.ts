import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative, dirname, normalize } from 'node:path';
import GithubSlugger from 'github-slugger';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';

// matches markdown links: [text](url)
const LINK_RE = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

// matches external/special URLs to skip
const SKIP_URL_RE = /^(https?:\/\/|mailto:|tel:|data:|javascript:|vbscript:)/i;

// matches headings in markdown: ## Heading text
const HEADING_RE = /^(#{2,6})\s+(.+)$/;

/**
 * Returns a set of 1-based line numbers inside fenced code blocks.
 */
function getCodeBlockLines(content: string): Set<number> {
  const lines = content.split('\n');
  const codeLines = new Set<number>();
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i].trim())) {
      inCodeBlock = !inCodeBlock;
      codeLines.add(i + 1);
      continue;
    }
    if (inCodeBlock) {
      codeLines.add(i + 1);
    }
  }

  return codeLines;
}

/**
 * Extracts heading anchor IDs from markdown content using github-slugger
 * (same algorithm as rehype-slug in the parser).
 */
function extractHeadingIds(content: string): Set<string> {
  const ids = new Set<string>();
  const slugger = new GithubSlugger();
  const lines = content.split('\n');
  const codeLines = getCodeBlockLines(content);

  for (let i = 0; i < lines.length; i++) {
    if (codeLines.has(i + 1)) {
      continue;
    }
    const match = HEADING_RE.exec(lines[i]);
    if (match) {
      // strip inline markdown (bold, italic, code, links) from heading text
      const text = match[2]
        .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
        .replace(/\*([^*]+)\*/g, '$1') // italic
        .replace(/`([^`]+)`/g, '$1') // inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .trim();
      ids.add(slugger.slug(text));
    }
  }

  return ids;
}

/**
 * Parses links from markdown content, skipping code blocks and image references.
 * Returns link refs with their line numbers.
 */
function extractLinks(content: string, codeLines: Set<number>): Array<{ ref: string; line: number }> {
  const results: Array<{ ref: string; line: number }> = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (codeLines.has(i + 1)) {
      continue;
    }
    const lineRe = new RegExp(LINK_RE.source, LINK_RE.flags);
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(lines[i])) !== null) {
      // skip image refs (preceded by !)
      if (m.index > 0 && lines[i][m.index - 1] === '!') {
        continue;
      }
      results.push({ ref: m[2], line: i + 1 });
    }
  }

  return results;
}

export async function checkCrossFile(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    return diagnostics;
  }

  const allFiles = entries.filter((e) => e.isFile());
  const mdFiles = allFiles.filter((e) => e.name.endsWith('.md'));
  const allFilePaths = new Set(allFiles.map((e) => relative(input.docsPath, join(e.parentPath, e.name))));

  // build a map of relative path -> heading IDs for each markdown file
  const fileHeadings = new Map<string, Set<string>>();
  const fileContents = new Map<string, string>();

  for (const md of mdFiles) {
    const absPath = join(md.parentPath, md.name);
    const relPath = relative(input.docsPath, absPath);

    let content: string;
    try {
      content = await readFile(absPath, 'utf-8');
    } catch {
      continue;
    }

    fileContents.set(relPath, content);
    fileHeadings.set(relPath, extractHeadingIds(content));
  }

  // check links in each markdown file
  for (const [relPath, content] of fileContents) {
    const codeLines = getCodeBlockLines(content);
    const links = extractLinks(content, codeLines);

    for (const { ref, line } of links) {
      // skip external and special URLs
      if (SKIP_URL_RE.test(ref)) {
        continue;
      }

      // split ref into path and optional anchor: "page.md#section" -> ["page.md", "section"]
      const [pathPart, anchor] = ref.split('#', 2);

      // anchor-links-resolve: same-file anchor (#section)
      if (!pathPart) {
        if (!input.strict) {
          continue;
        }
        if (anchor) {
          const headings = fileHeadings.get(relPath);
          if (headings && !headings.has(anchor)) {
            diagnostics.push({
              rule: Rule.AnchorLinksResolve,
              severity: 'error',
              file: relPath,
              line,
              title: 'Anchor link does not resolve',
              detail: `"#${anchor}" does not match any heading in this file.`,
            });
          }
        }
        continue;
      }

      // skip non-file references (absolute paths handled by internal-links-relative)
      if (pathPart.startsWith('/') || /^\.\.\//.test(pathPart)) {
        continue;
      }

      // resolve the path relative to the current file's directory
      const resolvedPath = normalize(join(dirname(relPath), pathPart));

      // internal-links-resolve: check that the target file exists
      if (!allFilePaths.has(resolvedPath)) {
        diagnostics.push({
          rule: Rule.InternalLinksResolve,
          severity: input.strict ? 'error' : 'warning',
          file: relPath,
          line,
          title: 'Internal link does not resolve',
          detail: `"${pathPart}" does not point to an existing file.`,
        });
        continue;
      }

      // anchor-links-resolve: if the link has an anchor, check it resolves in the target file
      if (anchor && input.strict) {
        const targetHeadings = fileHeadings.get(resolvedPath);
        if (targetHeadings && !targetHeadings.has(anchor)) {
          diagnostics.push({
            rule: Rule.AnchorLinksResolve,
            severity: 'error',
            file: relPath,
            line,
            title: 'Anchor link does not resolve',
            detail: `"#${anchor}" does not match any heading in "${pathPart}".`,
          });
        }
      }
    }
  }

  return diagnostics;
}

import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';

// matches HTML tags like <div>, <span class="x">, </p>, <br/>, <img src="..." />
// excludes markdown-safe self-closing <br> and <!-- comments -->
const HTML_TAG_RE = /< *\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;

// tags that are allowed in markdown (commonly used and safe)
const ALLOWED_HTML_TAGS = new Set(['br', 'wbr', 'hr', 'details', 'summary']);

// matches <script> tags (opening or self-closing)
const SCRIPT_TAG_RE = /<script\b[^>]*>/gi;

// matches HTML event handler attributes like onclick="...", onerror="..."
const EVENT_HANDLER_RE = /\bon[a-z]+\s*=\s*["'][^"']*["']/gi;

// matches markdown image references: ![alt](url)
const IMAGE_REF_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

// matches markdown links: [text](url)
const LINK_RE = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

// matches dangerous URI schemes
const DANGEROUS_URL_RE = /^(javascript|vbscript|data):/i;

// matches base64 image data in image refs
const BASE64_IMAGE_RE = /^data:image\/[^;]+;base64,/i;

// matches external URLs (http:// or https://)
const EXTERNAL_URL_RE = /^https?:\/\//i;

// matches path traversal
const PATH_TRAVERSAL_RE = /(?:^|\/)\.\.\//;

/**
 * Finds the 1-based line number of the first occurrence of a string in content.
 */
function findLine(content: string, needle: string): number | undefined {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(needle)) {
      return i + 1;
    }
  }
  return undefined;
}

/**
 * Checks whether a line is inside a fenced code block.
 * Returns a set of 1-based line numbers that are inside code blocks.
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
 * Finds the 1-based line number of a match, skipping code blocks.
 */
function findLineOutsideCode(content: string, needle: string, codeLines: Set<number>): number | undefined {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (codeLines.has(i + 1)) {
      continue;
    }
    if (lines[i].includes(needle)) {
      return i + 1;
    }
  }
  return undefined;
}

/**
 * Tests a regex against content lines, skipping code blocks.
 * Returns all matches with their line numbers.
 */
function matchOutsideCode(
  content: string,
  re: RegExp,
  codeLines: Set<number>
): Array<{ match: RegExpExecArray; line: number }> {
  const results: Array<{ match: RegExpExecArray; line: number }> = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (codeLines.has(i + 1)) {
      continue;
    }
    const lineRe = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(lines[i])) !== null) {
      results.push({ match: m, line: i + 1 });
    }
  }

  return results;
}

export async function checkMarkdown(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    return diagnostics;
  }

  const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.md'));

  for (const md of mdFiles) {
    const absPath = join(md.parentPath, md.name);
    const relPath = relative(input.docsPath, absPath);

    let content: string;
    try {
      content = await readFile(absPath, 'utf-8');
    } catch {
      continue;
    }

    const codeLines = getCodeBlockLines(content);

    // no-script-tags: no <script> tags
    for (const { match, line } of matchOutsideCode(content, SCRIPT_TAG_RE, codeLines)) {
      diagnostics.push({
        rule: Rule.NoScriptTags,
        severity: 'error',
        file: relPath,
        line,
        title: 'Script tag detected',
        detail: `"${match[0]}" is not allowed. Script tags pose a security risk.`,
      });
    }

    // no-script-tags: no event handler attributes (onclick, onerror, etc.)
    for (const { match, line } of matchOutsideCode(content, EVENT_HANDLER_RE, codeLines)) {
      diagnostics.push({
        rule: Rule.NoScriptTags,
        severity: 'error',
        file: relPath,
        line,
        title: 'Event handler attribute detected',
        detail: `"${match[0]}" is not allowed. Inline event handlers pose a security risk.`,
      });
    }

    // no-raw-html: no raw HTML tags (except allowed ones)
    for (const { match, line } of matchOutsideCode(content, HTML_TAG_RE, codeLines)) {
      const tagName = match[1].toLowerCase();
      // skip if it's a script tag (already handled above) or allowed tag
      if (tagName === 'script' || ALLOWED_HTML_TAGS.has(tagName)) {
        continue;
      }
      // skip HTML comments
      if (match[0].startsWith('<!--')) {
        continue;
      }
      diagnostics.push({
        rule: Rule.NoRawHtml,
        severity: input.strict ? 'error' : 'warning',
        file: relPath,
        line,
        title: 'Raw HTML tag detected',
        detail: `<${tagName}> is not allowed. Use markdown syntax instead of raw HTML.`,
      });
    }

    // process image references
    for (const { match, line } of matchOutsideCode(content, IMAGE_REF_RE, codeLines)) {
      const ref = match[2];

      // no-base64-images: no base64-encoded image data
      if (BASE64_IMAGE_RE.test(ref)) {
        diagnostics.push({
          rule: Rule.NoBase64Images,
          severity: 'error',
          file: relPath,
          line,
          title: 'Base64-encoded image detected',
          detail: `Base64-encoded images are not allowed. Save the image as a file in the img/ directory instead.`,
        });
        continue;
      }

      // no-external-images: no external image URLs
      if (EXTERNAL_URL_RE.test(ref)) {
        diagnostics.push({
          rule: Rule.NoExternalImages,
          severity: input.strict ? 'error' : 'warning',
          file: relPath,
          line,
          title: 'External image URL detected',
          detail: `"${ref}" is an external URL. Download the image and place it in the img/ directory.`,
        });
        continue;
      }

      // no-dangerous-urls: no javascript: or data: URIs in image refs
      if (DANGEROUS_URL_RE.test(ref)) {
        diagnostics.push({
          rule: Rule.NoDangerousUrls,
          severity: 'error',
          file: relPath,
          line,
          title: 'Dangerous URI scheme in image reference',
          detail: `"${ref}" uses a dangerous URI scheme. Only relative file paths are allowed.`,
        });
        continue;
      }

      // no-path-traversal: no ../ in image refs
      if (PATH_TRAVERSAL_RE.test(ref)) {
        diagnostics.push({
          rule: Rule.NoPathTraversal,
          severity: 'error',
          file: relPath,
          line,
          title: 'Path traversal in image reference',
          detail: `"${ref}" contains path traversal. Image references must not use "../".`,
        });
        continue;
      }

      // image-refs-relative: image refs must be relative paths (not absolute)
      if (ref.startsWith('/')) {
        diagnostics.push({
          rule: Rule.ImageRefsRelative,
          severity: 'error',
          file: relPath,
          line,
          title: 'Image reference is not a relative path',
          detail: `"${ref}" is an absolute path. Use a relative path like "img/filename.png" instead.`,
        });
      }
    }

    // process links (non-image)
    for (const { match, line } of matchOutsideCode(content, LINK_RE, codeLines)) {
      const ref = match[2];

      // skip image links (already handled above) - the LINK_RE also matches ![...](...) prefix
      // but since LINK_RE is [text](url) and IMAGE_REF_RE is ![alt](url), we need to check
      // if this match is preceded by ! on the same line
      const lineContent = content.split('\n')[line - 1];
      const matchIndex = lineContent.indexOf(match[0]);
      if (matchIndex > 0 && lineContent[matchIndex - 1] === '!') {
        continue;
      }

      // skip anchor-only links like #section
      if (ref.startsWith('#')) {
        continue;
      }

      // no-dangerous-urls: no javascript: or data: URIs
      if (DANGEROUS_URL_RE.test(ref)) {
        diagnostics.push({
          rule: Rule.NoDangerousUrls,
          severity: 'error',
          file: relPath,
          line,
          title: 'Dangerous URI scheme in link',
          detail: `"${ref}" uses a dangerous URI scheme. Use safe URLs only.`,
        });
        continue;
      }

      // no-path-traversal: no ../ in links
      if (PATH_TRAVERSAL_RE.test(ref)) {
        diagnostics.push({
          rule: Rule.NoPathTraversal,
          severity: 'error',
          file: relPath,
          line,
          title: 'Path traversal in link',
          detail: `"${ref}" contains path traversal. Links must not use "../".`,
        });
        continue;
      }

      // skip external URLs for internal-links-relative check
      if (EXTERNAL_URL_RE.test(ref)) {
        continue;
      }

      // skip mailto: and other non-file schemes
      if (/^[a-z]+:/i.test(ref)) {
        continue;
      }

      // internal-links-relative: internal links must be relative .md paths
      if (ref.startsWith('/')) {
        diagnostics.push({
          rule: Rule.InternalLinksRelative,
          severity: input.strict ? 'error' : 'warning',
          file: relPath,
          line,
          title: 'Internal link is not a relative path',
          detail: `"${ref}" is an absolute path. Use a relative path like "./page.md" instead.`,
        });
      }
    }
  }

  return diagnostics;
}

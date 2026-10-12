import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';
import { isMetaFile, maskInlineCode } from './utils.js';

// the markers `create-plugin` used before briefs became comments. The text between them renders, so it is a stub
const LEGACY_BRIEF_START_RE = /<!--\s*section-brief:start\s*-->/;
// a comment that starts with `section-brief`, not the legacy `section-brief:start` marker
const BRIEF_COMMENT_RE = /^<!--\s*section-brief(?![\w:-])/;
const HEADING_RE = /^ {0,3}(#{1,6})\s+\S/;
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

interface Section {
  /** Absent for the text before the first heading. */
  heading?: { level: number; line: number };
  briefLines: number[];
  hasContent: boolean;
}

/**
 * Splits a page into the text under each heading. Frontmatter, HTML comments and blank lines are not
 * content, and a `#` inside a fenced code block does not start a section.
 */
function parseSections(raw: string): Section[] {
  const lines = raw.split('\n');
  const sections: Section[] = [{ briefLines: [], hasContent: false }];

  let start = 0;
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
    start = end === -1 ? 0 : end + 1;
  }

  let fence: string | undefined;
  let inComment = false;
  for (let i = start; i < lines.length; i++) {
    const current = sections[sections.length - 1];

    if (fence) {
      current.hasContent = true;
      const closer = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(lines[i]);
      if (closer && closer[1][0] === fence[0] && closer[1].length >= fence.length) {
        fence = undefined;
      }
      continue;
    }

    let rest = lines[i];
    let visible = '';
    while (rest.length > 0) {
      if (inComment) {
        const end = rest.indexOf('-->');
        if (end === -1) {
          break;
        }
        inComment = false;
        rest = rest.slice(end + 3);
        continue;
      }
      // masking keeps the length, so the index still points into `rest`
      const open = maskInlineCode(rest).indexOf('<!--');
      if (open === -1) {
        visible += rest;
        break;
      }
      visible += rest.slice(0, open);
      const comment = rest.slice(open);
      if (BRIEF_COMMENT_RE.test(comment)) {
        current.briefLines.push(i + 1);
      }
      inComment = true;
      rest = comment.slice(4);
    }

    if (visible.trim() === '') {
      continue;
    }
    const fenceOpen = FENCE_RE.exec(visible);
    if (fenceOpen) {
      fence = fenceOpen[1];
      current.hasContent = true;
      continue;
    }
    const heading = HEADING_RE.exec(visible);
    if (heading) {
      sections.push({ heading: { level: heading[1].length, line: i + 1 }, briefLines: [], hasContent: false });
      continue;
    }
    current.hasContent = true;
  }

  return sections;
}

/**
 * Checks pages for scaffolding and sections that were never written:
 *
 * - `empty-section`: a heading with no content, or text before the first heading that is only a
 *   section brief. A heading is not empty when a deeper heading follows it directly.
 * - `unfilled-section-brief`: a brief left in a section that has content, or a legacy
 *   `section-brief:start` marker block.
 *
 * Both are warnings, so a freshly scaffolded docs folder still passes `validate`.
 */
export async function checkStubContent(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    return diagnostics;
  }

  const mdFiles = entries.filter(
    (e) =>
      e.isFile() &&
      e.name.endsWith('.md') &&
      !isMetaFile(e.name) &&
      !e.parentPath.includes('node_modules') &&
      !e.parentPath.includes('dist')
  );

  for (const file of mdFiles) {
    const absolutePath = join(file.parentPath, file.name);
    const relativePath = relative(input.docsPath, absolutePath);
    let raw: string;
    try {
      raw = await readFile(absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = raw.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!LEGACY_BRIEF_START_RE.test(lines[i])) {
        continue;
      }
      diagnostics.push({
        rule: Rule.UnfilledSectionBrief,
        severity: 'warning',
        file: relativePath,
        line: i + 1,
        title: 'Unfilled documentation stub',
        detail:
          "This section still has scaffolded authoring guidance (<!-- section-brief:start -->) instead of real content. Replace it with your plugin's actual documentation and remove the marker.",
      });
    }

    const sections = parseSections(raw);
    sections.forEach((section, index) => {
      const next = sections[index + 1];
      const hasBrief = section.briefLines.length > 0;
      const isParentHeading =
        section.heading !== undefined && next?.heading !== undefined && next.heading.level > section.heading.level;
      const isEmpty = !section.hasContent && !isParentHeading && (section.heading !== undefined || hasBrief);

      if (isEmpty) {
        diagnostics.push({
          rule: Rule.EmptySection,
          severity: 'warning',
          file: relativePath,
          line: section.heading?.line ?? section.briefLines[0],
          title: hasBrief ? 'Unfilled documentation stub' : 'Empty section',
          detail: hasBrief
            ? "This section only has its section brief. Write the section from the brief and delete the brief, or remove the heading if the section doesn't apply."
            : 'This heading has no content before the next heading. Add content, or remove the heading.',
        });
        return;
      }

      for (const line of section.briefLines) {
        diagnostics.push({
          rule: Rule.UnfilledSectionBrief,
          severity: 'warning',
          file: relativePath,
          line,
          title: 'Leftover section brief',
          detail:
            "This section has content, but its section brief comment is still here. It isn't shown in the catalog. Delete it to keep the page tidy.",
        });
      }
    });
  }

  return diagnostics;
}

import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import { CALLOUT_TYPES, getYouTubeVideoId } from '@grafana/plugin-docs-parser';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';
import {
  escapesDocsRoot,
  getCodeBlockLines,
  getNonProseLines,
  getReferenceDefinitions,
  isMetaFile,
  matchOutsideCode,
  normalizeLabel,
} from './utils.js';

// matches HTML tags like <div>, <span class="x">, </p>, <br/>, <img src="..." />
const HTML_TAG_RE = /< *\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;

// tags that are allowed in markdown (commonly used and safe)
const ALLOWED_HTML_TAGS = new Set(['br', 'wbr', 'hr', 'details', 'summary']);

// matches <script> tags (opening or self-closing)
const SCRIPT_TAG_RE = /<script\b[^>]*>/gi;

// matches HTML event handler attributes like onclick="...", onerror="...", ontoggle=alert(1)
const EVENT_HANDLER_RE = /\bon[a-z]+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi;

// matches markdown image references: ![alt](url)
const IMAGE_REF_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\)/g;

// matches markdown links: [text](url)
const LINK_RE = /\[([^\]]*)\]\(([^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\)/g;

// matches dangerous URI schemes
const DANGEROUS_URL_RE = /^(javascript|vbscript|data):/i;

// matches base64 image data in image refs
const BASE64_IMAGE_RE = /^data:image\/[^;]+;base64,/i;

// matches external URLs (http:// or https://)
const EXTERNAL_URL_RE = /^https?:\/\//i;

// matches the opening of a Hugo shortcode, {{< name ... >}} or {{% name ... %}}, capturing the closing slash and name
const HUGO_SHORTCODE_RE = /\{\{[<%]\s*(\/?)\s*([a-zA-Z][\w./-]*)/g;

// matches template placeholders like <GRAFANA_VERSION> left in a URL
const URL_PLACEHOLDER_RE = /<[A-Z][A-Z0-9_]*>/;

// matches a callout marker opening a blockquote line, like > [!NOTE], capturing the type and any text after it
const CALLOUT_MARKER_RE = /^\s*>\s*\[!([a-zA-Z]+)\](.*)$/;

// matches a line holding only a link, [text](url) or a bare URL, capturing the url
const LONE_LINK_RE = /^\s*(?:\[[^\]]*\]\(([^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\)|((?:https?:\/\/|www\.)\S+))\s*$/;

// matches a line holding only a reference link, [text][label], [label][] or [label], capturing text and label
const LONE_REFERENCE_LINK_RE = /^\s*\[([^\]]+)\](?:\[([^\]]*)\])?\s*$/;

const VIDEO_REF_RE = /\.(?:mp4|webm)(?:[?#].*)?$/i;

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];

const CALLOUT_TYPE_NAMES = Object.keys(CALLOUT_TYPES).map((type) => type.toUpperCase());

const SHORTCODE_REPLACEMENTS: Record<string, string> = {
  admonition: 'Use a callout instead, for example a blockquote starting with > [!NOTE].',
  figure: 'Use a markdown image instead, for example ![Alt text](img/screenshot.png).',
  youtube: 'Put a YouTube link alone in its own paragraph to embed the video.',
  'video-embed': 'Use a markdown image with an mp4 or webm file instead, for example ![Demo](video/demo.mp4).',
  vimeo: 'Link to the video instead.',
  'docs/shared': 'Copy the shared content into this page instead.',
};

// true when an earlier line of the same block is quoted, including across lazy continuation lines
function isInsideBlockquote(lines: string[], index: number): boolean {
  for (let i = index - 1; i >= 0 && lines[i].trim() !== ''; i--) {
    if (/^\s*>/.test(lines[i])) {
      return true;
    }
  }
  return false;
}

// true for a YouTube video-style URL, so a channel or playlist link isn't mistaken for a broken embed
function looksLikeYouTubeVideo(href: string): boolean {
  try {
    const url = new URL(href);
    if (!YOUTUBE_HOSTS.includes(url.hostname)) {
      return false;
    }
    return url.hostname === 'youtu.be' || url.pathname === '/watch' || /^\/(?:embed|shorts)\//.test(url.pathname);
  } catch {
    return false;
  }
}

export async function checkMarkdown(input: ValidationInput): Promise<Diagnostic[]> {
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
    const nonProseLines = getNonProseLines(content);

    // no-script-tags: no <script> tags
    for (const { match, line } of matchOutsideCode(content, SCRIPT_TAG_RE, codeLines, { maskInlineCode: true })) {
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
    for (const { match, line } of matchOutsideCode(content, EVENT_HANDLER_RE, codeLines, { maskInlineCode: true })) {
      diagnostics.push({
        rule: Rule.NoScriptTags,
        severity: 'error',
        file: relPath,
        line,
        title: 'Event handler attribute detected',
        detail: `"${match[0]}" is not allowed. Inline event handlers pose a security risk.`,
      });
    }

    const contentLines = content.split('\n');

    // no-hugo-shortcodes: no {{< >}} or {{% %}} shortcodes, reported once per opening tag
    for (const { match, line } of matchOutsideCode(content, HUGO_SHORTCODE_RE, codeLines, {
      maskInlineCode: true,
      skipLines: nonProseLines,
    })) {
      if (match[1] === '/') {
        continue;
      }
      const name = match[2];
      diagnostics.push({
        rule: Rule.NoHugoShortcodes,
        severity: input.strict ? 'error' : 'warning',
        file: relPath,
        line,
        title: 'Hugo shortcode detected',
        detail: `The "${name}" Hugo shortcode isn't supported in plugin docs. ${
          SHORTCODE_REPLACEMENTS[name] ?? 'Write it in plain markdown instead.'
        }`,
      });
    }

    // valid-callout-marker: a [!TYPE] marker that would silently render as a plain quote
    for (const { match, line } of matchOutsideCode(content, CALLOUT_MARKER_RE, codeLines, {
      skipLines: nonProseLines,
    })) {
      const marker = `[!${match[1]}]`;
      if (!CALLOUT_TYPE_NAMES.includes(match[1].toUpperCase())) {
        diagnostics.push({
          rule: Rule.ValidCalloutMarker,
          severity: 'warning',
          file: relPath,
          line,
          title: 'Unknown callout type',
          detail: `"${marker}" isn't a callout type, so this renders as a plain quote. Use one of ${CALLOUT_TYPE_NAMES.join(', ')}.`,
        });
      } else if (isInsideBlockquote(contentLines, line - 1)) {
        diagnostics.push({
          rule: Rule.ValidCalloutMarker,
          severity: 'warning',
          file: relPath,
          line,
          title: 'Callout marker not at the start of the quote',
          detail: `"${marker}" only works on the first line of a blockquote, so this renders as a plain quote. Start a new blockquote for the callout.`,
        });
      } else if (match[2].trim() !== '') {
        diagnostics.push({
          rule: Rule.ValidCalloutMarker,
          severity: 'warning',
          file: relPath,
          line,
          title: 'Callout text on the marker line',
          detail: `Move the text after "${marker}" to the next line. With text on the same line, this renders as a plain quote.`,
        });
      }
    }

    const definitions = getReferenceDefinitions(content, codeLines);
    const definitionsByLabel = new Map(definitions.map((definition) => [definition.label, definition.ref]));

    // valid-youtube-link: a YouTube link alone in a paragraph that would silently not embed
    contentLines.forEach((text, index) => {
      const lineNumber = index + 1;
      const reference = text.match(LONE_REFERENCE_LINK_RE);
      const referenceLabel = reference && normalizeLabel(reference[2] || reference[1]);
      const rawHref =
        text.match(LONE_LINK_RE)?.slice(1).find(Boolean) ??
        (referenceLabel ? definitionsByLabel.get(referenceLabel) : undefined);
      const href = rawHref?.startsWith('www.') ? `https://${rawHref}` : rawHref;
      const startsParagraph = (contentLines[index - 1]?.trim() ?? '') === '' || nonProseLines.has(lineNumber - 1);
      const isAlone = startsParagraph && (contentLines[index + 1]?.trim() ?? '') === '';
      if (!href || !isAlone || nonProseLines.has(lineNumber) || codeLines.has(lineNumber)) {
        return;
      }
      if (looksLikeYouTubeVideo(href) && !getYouTubeVideoId(href)) {
        diagnostics.push({
          rule: Rule.ValidYoutubeLink,
          severity: 'warning',
          file: relPath,
          line: lineNumber,
          title: 'YouTube link is not embedded',
          detail: `"${href}" has no valid 11-character video id, so it renders as a plain link. Check the id, or use a watch, youtu.be, embed or Shorts URL.`,
        });
      }
    });

    // no-raw-html: no raw HTML tags (except allowed ones). Inline code spans
    // are masked first so placeholder text like `<slug>` inside backticks
    // isn't mistaken for a real tag.
    for (const { match, line } of matchOutsideCode(content, HTML_TAG_RE, codeLines, { maskInlineCode: true })) {
      const tagName = match[1].toLowerCase();
      // skip if it's a script tag (already handled above) or allowed tag
      if (tagName === 'script' || ALLOWED_HTML_TAGS.has(tagName)) {
        continue;
      }
      // skip the <name> inside a {{< name >}} shortcode, already reported by no-hugo-shortcodes
      if (contentLines[line - 1].slice(Math.max(0, match.index - 2), match.index) === '{{') {
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

    // process image references, inline ![alt](url) and reference definitions used by an image
    const imageRefs = [
      ...matchOutsideCode(content, IMAGE_REF_RE, codeLines).map(({ match, line }) => ({ ref: match[2], line })),
      ...definitions.filter((definition) => definition.isImage),
    ];
    for (const { ref, line } of imageRefs) {
      const isVideo = VIDEO_REF_RE.test(ref);
      const kind = isVideo ? 'video' : 'image';
      const folder = isVideo ? 'docs folder' : 'img/ directory';

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
          title: `External ${kind} URL detected`,
          detail: `"${ref}" is an external URL. Download the ${kind} and place it in the ${folder}.`,
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
          title: `Dangerous URI scheme in ${kind} reference`,
          detail: `"${ref}" uses a dangerous URI scheme. Only relative file paths are allowed.`,
        });
        continue;
      }

      // no-path-traversal: image refs must stay inside the docs folder
      if (escapesDocsRoot(ref, relPath)) {
        diagnostics.push({
          rule: Rule.NoPathTraversal,
          severity: 'error',
          file: relPath,
          line,
          title: `Path traversal in ${kind} reference`,
          detail: `"${ref}" points outside the docs folder. ${isVideo ? 'Video' : 'Image'} references must stay inside it.`,
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
          title: `${isVideo ? 'Video' : 'Image'} reference is not a relative path`,
          detail: `"${ref}" is an absolute path. Use a relative path like "${isVideo ? 'video/filename.mp4' : 'img/filename.png'}" instead.`,
        });
      }
    }

    // no-url-placeholders: no unreplaced template placeholders like <GRAFANA_VERSION> in link or image URLs
    const placeholderRefs = [
      ...matchOutsideCode(content, LINK_RE, codeLines, { maskInlineCode: true, skipLines: nonProseLines }).map(
        ({ match, line }) => ({ ref: match[2], line })
      ),
      ...getReferenceDefinitions(content, new Set([...codeLines, ...nonProseLines])),
    ];
    for (const { ref, line } of placeholderRefs) {
      const placeholder = ref.match(URL_PLACEHOLDER_RE)?.[0];
      if (!placeholder) {
        continue;
      }
      diagnostics.push({
        rule: Rule.NoUrlPlaceholders,
        severity: input.strict ? 'error' : 'warning',
        file: relPath,
        line,
        title: 'Placeholder in link URL',
        detail: `"${ref}" contains the placeholder ${placeholder}, which isn't replaced in plugin docs and breaks the link. Write the real value instead${
          placeholder.endsWith('VERSION>') ? ', for example "latest"' : ''
        }.`,
      });
    }

    // process links (non-image), inline [text](url) and reference definitions not used by an image.
    // LINK_RE also matches the [alt](url) part of ![alt](url), so skip a match preceded by !
    const linkRefs = [
      ...matchOutsideCode(content, LINK_RE, codeLines)
        .filter(({ match, line }) => !(match.index > 0 && contentLines[line - 1][match.index - 1] === '!'))
        .map(({ match, line }) => ({ ref: match[2], line })),
      ...definitions.filter((definition) => !definition.isImage),
    ];
    for (const { ref, line } of linkRefs) {
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

      // no-path-traversal: links must stay inside the docs folder
      if (escapesDocsRoot(ref, relPath)) {
        diagnostics.push({
          rule: Rule.NoPathTraversal,
          severity: 'error',
          file: relPath,
          line,
          title: 'Path traversal in link',
          detail: `"${ref}" points outside the docs folder. Links must stay inside it.`,
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

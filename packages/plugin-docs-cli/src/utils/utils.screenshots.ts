import { extname, posix, relative, resolve, dirname, sep } from 'node:path';
import type { PluginScreenshots } from '../validation/types.js';
import { ALLOWED_IMAGE_EXTENSIONS } from '../validation/rules/filesystem.js';
import { decodeRefPath, getCodeBlockLines, getReferenceDefinitions } from '../validation/rules/utils.js';

// matches markdown image references: ![alt](url)
const IMAGE_REF_RE = /(!\[[^\]]*\]\()([^)\s]+)((?:\s+(?:"[^"]*"|'[^']*'))?\))/g;

/**
 * The absolute path of the plugin screenshot that an image reference in a page points at, or undefined
 * when it points anywhere else. A screenshot is a file that `info.screenshots` in plugin.json lists, so a
 * page can show it from where the plugin already keeps it, such as `../src/img/screenshots/x.png`.
 *
 * @param ref - The image reference as written in the page
 * @param pageRelPath - The page's path relative to the docs folder
 * @param docsPath - The absolute path of the docs folder
 * @param screenshots - The plugin's screenshots. Without them nothing matches
 */
export function resolveScreenshotRef(
  ref: string,
  pageRelPath: string,
  docsPath: string,
  screenshots?: PluginScreenshots
): string | undefined {
  if (!screenshots) {
    return undefined;
  }

  const decoded = decodeRefPath(ref);
  if (decoded === '' || decoded.includes('\\') || decoded.startsWith('/')) {
    return undefined;
  }
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extname(decoded).toLowerCase())) {
    return undefined;
  }

  const pageDir = posix.dirname(pageRelPath.replace(/\\/g, '/'));
  const target = resolve(docsPath, ...posix.normalize(posix.join(pageDir, decoded)).split('/'));
  return screenshots.paths.some((path) => resolve(screenshots.root, path) === target) ? target : undefined;
}

export interface BuiltDocs {
  /** The absolute path of the docs folder in the plugin's source. */
  docsPath: string;
  /** The absolute path of the built docs folder. */
  builtDocsPath: string;
  /** The absolute path of the folder the built plugin keeps its files in, where screenshot paths resolve. */
  builtRoot: string;
  screenshots: PluginScreenshots;
}

/**
 * Rewrites the image references in a page that point at a plugin screenshot in the source, so they point
 * at the same screenshot in the built plugin. Code blocks are left as they are.
 *
 * @param content - The markdown of the page
 * @param pageRelPath - The page's path relative to the docs folder
 * @returns The new markdown, which is `content` itself when no reference changed
 */
export function rewriteScreenshotRefs(content: string, pageRelPath: string, built: BuiltDocs): string {
  const { docsPath, builtDocsPath, builtRoot, screenshots } = built;
  const builtPageDir = dirname(resolve(builtDocsPath, ...pageRelPath.replace(/\\/g, '/').split('/')));

  const rewrite = (ref: string): string => {
    const screenshot = resolveScreenshotRef(ref, pageRelPath, docsPath, screenshots);
    if (!screenshot) {
      return ref;
    }
    const builtScreenshot = resolve(builtRoot, relative(screenshots.root, screenshot));
    const suffix = ref.slice(ref.split(/[?#]/)[0].length);
    return relative(builtPageDir, builtScreenshot).split(sep).join('/') + suffix;
  };

  const codeLines = getCodeBlockLines(content);
  const lines = content.split('\n');

  for (const definition of getReferenceDefinitions(content, codeLines)) {
    if (definition.isImage) {
      lines[definition.line - 1] = lines[definition.line - 1].replace(definition.ref, () => rewrite(definition.ref));
    }
  }

  const rewritten = lines.map((line, index) =>
    codeLines.has(index + 1)
      ? line
      : line.replace(
          IMAGE_REF_RE,
          (_match, before: string, ref: string, after: string) => `${before}${rewrite(ref)}${after}`
        )
  );

  const result = rewritten.join('\n');
  return result === content ? content : result;
}

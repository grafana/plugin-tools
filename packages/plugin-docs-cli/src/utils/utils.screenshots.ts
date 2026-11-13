import { extname, isAbsolute, posix, relative, resolve, dirname, sep } from 'node:path';
import type { PluginScreenshots } from '../validation/types.js';
import { ALLOWED_IMAGE_EXTENSIONS } from '../validation/rules/filesystem.js';
import {
  IMAGE_REF_RE,
  decodeRefPath,
  escapesDocsRoot,
  getCodeBlockLines,
  getReferenceDefinitions,
} from '../validation/rules/utils.js';

/**
 * The absolute path of the plugin screenshot that an image reference in a page points at, or undefined
 * when it points anywhere else. A screenshot is a file that `info.screenshots` in plugin.json lists, so a
 * page can show it from where the plugin already keeps it, such as `../src/img/screenshots/x.png`. Only a
 * reference that leaves the docs folder matches, since one inside it is an ordinary docs image.
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
  if (!screenshots || !escapesDocsRoot(ref, pageRelPath)) {
    return undefined;
  }

  const decoded = decodeRefPath(ref);
  if (decoded.includes('\\') || decoded.startsWith('/')) {
    return undefined;
  }
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extname(decoded).toLowerCase())) {
    return undefined;
  }

  const pageDir = posix.dirname(pageRelPath.replace(/\\/g, '/'));
  const target = resolve(docsPath, ...posix.normalize(posix.join(pageDir, decoded)).split('/'));
  return screenshots.paths.some(
    (path) => isInside(screenshots.root, path) && resolve(screenshots.root, path) === target
  )
    ? target
    : undefined;
}

// a screenshot path that leaves the plugin isn't in the plugin archive, so it never counts
export function isInside(root: string, path: string): boolean {
  const fromRoot = relative(root, resolve(root, path));
  return fromRoot !== '' && fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`) && !isAbsolute(fromRoot);
}

// percent-encodes what would end a markdown link destination or break it as a URL
export function encodeRefPath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment).replace(/\(/g, '%28').replace(/\)/g, '%29'))
    .join('/');
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
 * at the same screenshot in the built plugin. Code blocks are left as they are, as validation reads them.
 *
 * @param content - The markdown of the page
 * @param pageRelPath - The page's path relative to the docs folder
 * @returns The new markdown
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
    return encodeRefPath(relative(builtPageDir, builtScreenshot).split(sep).join('/')) + suffix;
  };

  const codeLines = getCodeBlockLines(content);
  const lines = content.split('\n');

  // the destination follows the label, so a label that repeats the destination is left alone
  for (const definition of getReferenceDefinitions(content, codeLines)) {
    if (definition.isImage) {
      const line = lines[definition.line - 1];
      const afterLabel = line.indexOf(']:') + 2;
      lines[definition.line - 1] =
        line.slice(0, afterLabel) + line.slice(afterLabel).replace(definition.ref, () => rewrite(definition.ref));
    }
  }

  return lines
    .map((line, index) => {
      if (codeLines.has(index + 1)) {
        return line;
      }
      // spliced from the end, so earlier offsets stay valid
      return [...line.matchAll(IMAGE_REF_RE)].reverse().reduce((result, match) => {
        const start = match.index + match[0].indexOf('](') + 2;
        const ref = match[2];
        return result.slice(0, start) + rewrite(ref) + result.slice(start + ref.length);
      }, line);
    })
    .join('\n');
}

import { readFile, readdir, stat } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, extname, dirname, relative, normalize } from 'node:path';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';
import { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_VIDEO_EXTENSIONS } from './filesystem.js';
import { decodeRefPath, formatBytes, getReferenceDefinitions, isMetaFile } from './utils.js';

const IMAGE_FILE_NAME_RE = /^[a-zA-Z0-9\-_.]+$/;
const MAX_STATIC_SIZE = 300 * 1024; // 300KB
const MAX_GIF_SIZE = 1024 * 1024; // 1MB
const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Finds the 1-based line number of the first occurrence of a string in content.
 */
function findRefLine(content: string, ref: string): number | undefined {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(ref)) {
      return i + 1;
    }
  }
  return undefined;
}

export async function checkAssets(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    return diagnostics;
  }

  const allFiles = entries.filter((e) => e.isFile());
  const imageFiles = allFiles.filter((e) => ALLOWED_IMAGE_EXTENSIONS.has(extname(e.name).toLowerCase()));
  const videoFiles = allFiles.filter((e) => ALLOWED_VIDEO_EXTENSIONS.has(extname(e.name).toLowerCase()));
  const svgFiles = allFiles.filter((e) => extname(e.name).toLowerCase() === '.svg');
  const mdFiles = allFiles.filter((e) => e.name.endsWith('.md') && !isMetaFile(e.name));

  // helper to get path relative to docsPath
  function rel(entry: Dirent): string {
    return relative(input.docsPath, join(entry.parentPath, entry.name));
  }

  // no-svg-files: SVG is an XSS risk
  for (const svg of svgFiles) {
    diagnostics.push({
      rule: Rule.NoSvg,
      severity: 'error',
      file: rel(svg),
      title: 'SVG files are not allowed',
      detail: `"${svg.name}" is an SVG file. SVG files can contain embedded scripts and pose an XSS risk. Use PNG or WebP instead.`,
    });
  }

  // image-file-naming: image and video filenames must use only [a-zA-Z0-9-_.]
  for (const img of [...imageFiles, ...videoFiles]) {
    if (!IMAGE_FILE_NAME_RE.test(img.name)) {
      diagnostics.push({
        rule: Rule.ImageFileNaming,
        severity: input.strict ? 'error' : 'info',
        file: rel(img),
        title: `${ALLOWED_VIDEO_EXTENSIONS.has(extname(img.name).toLowerCase()) ? 'Video' : 'Image'} filename contains invalid characters`,
        detail: `"${img.name}" should use only letters, digits, hyphens, underscores and dots.`,
      });
    }
  }

  // max-image-size and max-total-images-size: check individual and total sizes
  let totalSize = 0;
  for (const img of imageFiles) {
    const absPath = join(img.parentPath, img.name);
    let size: number;
    try {
      const st = await stat(absPath);
      size = st.size;
    } catch {
      continue;
    }
    totalSize += size;

    const ext = extname(img.name).toLowerCase();
    const isGif = ext === '.gif';
    const maxSize = isGif ? MAX_GIF_SIZE : MAX_STATIC_SIZE;
    const maxLabel = isGif ? '1MB' : '300KB';
    if (size > maxSize) {
      diagnostics.push({
        rule: Rule.MaxImageSize,
        severity: input.strict ? 'error' : 'info',
        file: rel(img),
        title: `Image exceeds ${maxLabel} limit`,
        detail: `"${img.name}" is ${formatBytes(size)} which exceeds the ${maxLabel} limit for ${isGif ? 'GIF' : 'static'} images. Compress or resize the image.`,
      });
    }
  }

  // max-video-size: videos ship inside every plugin download, so they stay small
  for (const video of videoFiles) {
    let size: number;
    try {
      size = (await stat(join(video.parentPath, video.name))).size;
    } catch {
      continue;
    }
    if (size > MAX_VIDEO_SIZE) {
      diagnostics.push({
        rule: Rule.MaxVideoSize,
        severity: input.strict ? 'error' : 'info',
        file: rel(video),
        title: 'Video exceeds 2MB limit',
        detail: `"${video.name}" is ${formatBytes(size)} which exceeds the 2MB limit for videos. Shorten or compress the video, or upload it to YouTube and link to it.`,
      });
    }
  }

  // max-total-images-size: only checked under `validate` (not `serve`)
  if (input.strict && totalSize > MAX_TOTAL_SIZE) {
    diagnostics.push({
      rule: Rule.MaxTotalImagesSize,
      severity: 'warning',
      title: 'Total image size exceeds 5MB',
      detail: `Total image size is ${formatBytes(totalSize)} which exceeds the 5MB limit. Reduce the number or size of images.`,
    });
  }

  // referenced-images-exist and no-orphaned-images: parse markdown for image refs
  const allFilePaths = new Set(allFiles.map((e) => rel(e)));
  const referencedPaths = new Set<string>();

  for (const md of mdFiles) {
    const absPath = join(md.parentPath, md.name);
    const mdRelPath = rel(md);
    let content: string;
    try {
      content = await readFile(absPath, 'utf-8');
    } catch {
      continue;
    }

    const imageRefRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    const imageRefs = [
      ...Array.from(content.matchAll(imageRefRe), (match) => match[2]),
      ...getReferenceDefinitions(content, new Set())
        .filter((definition) => definition.isImage)
        .map((definition) => definition.ref),
    ];
    for (const ref of imageRefs) {
      // skip refs that aren't local file paths; data URIs are rejected by no-base64-images and no-dangerous-urls
      if (/^https?:\/\//i.test(ref) || /^\/\//.test(ref) || /^blob:/i.test(ref) || /^data:/i.test(ref)) {
        continue;
      }

      // root-relative paths (e.g. /img/foo.png) resolve against docs root
      // looked up by the decoded path, as the renderer reads it
      const refPath = decodeRefPath(ref);
      const resolvedPath = refPath.startsWith('/')
        ? normalize(refPath.slice(1))
        : normalize(join(dirname(mdRelPath), refPath));
      referencedPaths.add(resolvedPath);

      // referenced-images-exist: check that the target file exists on disk
      if (!allFilePaths.has(resolvedPath)) {
        const kind = ALLOWED_VIDEO_EXTENSIONS.has(extname(resolvedPath).toLowerCase()) ? 'video' : 'image';
        diagnostics.push({
          rule: Rule.ReferencedImagesExist,
          severity: 'error',
          file: mdRelPath,
          line: findRefLine(content, ref),
          title: `Referenced ${kind} does not exist`,
          detail: `${kind === 'video' ? 'Video' : 'Image'} "${ref}" referenced in markdown does not exist on disk.`,
        });
      }
    }
  }

  // no-orphaned-images: only checked under `validate` (not `serve`)
  if (input.strict) {
    for (const img of [...imageFiles, ...videoFiles]) {
      const relPath = rel(img);
      if (!referencedPaths.has(relPath)) {
        const kind = ALLOWED_VIDEO_EXTENSIONS.has(extname(img.name).toLowerCase()) ? 'video' : 'image';
        diagnostics.push({
          rule: Rule.NoOrphanedImages,
          severity: 'info',
          file: relPath,
          title: `Unreferenced ${kind}`,
          detail: `"${img.name}" is not referenced by any markdown file. Remove it if it is no longer needed.`,
        });
      }
    }
  }

  return diagnostics;
}

import { readFile, readdir, stat } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, extname, dirname, relative, sep, normalize } from 'node:path';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';

const ALLOWED_IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const IMAGE_FILE_NAME_RE = /^[a-z0-9\-_.]+$/;
const MAX_STATIC_SIZE = 300 * 1024; // 300KB
const MAX_GIF_SIZE = 1024 * 1024; // 1MB
const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Checks whether a relative path is inside a directory named `img`.
 */
function isInImgDir(relativePath: string): boolean {
  const parts = relativePath.split(sep);
  // check directory components (everything except the filename)
  return parts.slice(0, -1).includes('img');
}

/**
 * Formats a byte count as a human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)}KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
}

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
  const imageFiles = allFiles.filter((e) => ALLOWED_IMAGE_EXT.has(extname(e.name).toLowerCase()));
  const svgFiles = allFiles.filter((e) => extname(e.name).toLowerCase() === '.svg');
  const mdFiles = allFiles.filter((e) => e.name.endsWith('.md'));

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

  // images-in-img-dir: all image files must be inside an img/ directory
  for (const img of imageFiles) {
    const relPath = rel(img);
    if (!isInImgDir(relPath)) {
      diagnostics.push({
        rule: Rule.ImagesInImgDir,
        severity: input.strict ? 'error' : 'info',
        file: relPath,
        title: 'Image not in img/ directory',
        detail: `"${img.name}" must be inside an img/ directory. Move it to the img/ folder next to the markdown files that reference it.`,
      });
    }
  }

  // allowed-image-formats: files in img/ dirs must be allowed image formats
  for (const file of allFiles) {
    const relPath = rel(file);
    if (!isInImgDir(relPath)) {
      continue;
    }
    const ext = extname(file.name).toLowerCase();
    if (ext === '.svg') {
      // handled by no-svg-files
      continue;
    }
    if (!ALLOWED_IMAGE_EXT.has(ext)) {
      diagnostics.push({
        rule: Rule.AllowedImageFormats,
        severity: input.strict ? 'error' : 'info',
        file: relPath,
        title: 'Image format not allowed',
        detail: `"${file.name}" is not an allowed image format. Only png, jpg, jpeg, webp and gif files are permitted.`,
      });
    }
  }

  // image-file-naming: image filenames must use only [a-z0-9-_.]
  for (const img of imageFiles) {
    if (!IMAGE_FILE_NAME_RE.test(img.name)) {
      diagnostics.push({
        rule: Rule.ImageFileNaming,
        severity: input.strict ? 'error' : 'info',
        file: rel(img),
        title: 'Image filename contains invalid characters',
        detail: `"${img.name}" should use only lowercase letters, digits, hyphens, underscores and dots.`,
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

  // max-total-images-size: only in strict mode (serve = '-')
  if (input.strict && totalSize > MAX_TOTAL_SIZE) {
    diagnostics.push({
      rule: Rule.MaxTotalImagesSize,
      severity: 'warning',
      title: 'Total image size exceeds 5MB',
      detail: `Total image size is ${formatBytes(totalSize)} which exceeds the 5MB limit. Reduce the number or size of images.`,
    });
  }

  // referenced-images-exist and no-orphaned-images: parse markdown for image refs
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
    let match: RegExpExecArray | null;
    while ((match = imageRefRe.exec(content)) !== null) {
      const ref = match[2];
      // skip external URLs and data URIs
      if (/^https?:\/\//i.test(ref) || /^data:/i.test(ref)) {
        continue;
      }
      const resolvedPath = normalize(join(dirname(mdRelPath), ref));
      referencedPaths.add(resolvedPath);

      // referenced-images-exist: check that the target file exists on disk
      const entryExists = allFiles.some((e) => rel(e) === resolvedPath);
      if (!entryExists) {
        diagnostics.push({
          rule: Rule.ReferencedImagesExist,
          severity: 'error',
          file: mdRelPath,
          line: findRefLine(content, ref),
          title: 'Referenced image does not exist',
          detail: `Image "${ref}" referenced in markdown does not exist on disk.`,
        });
      }
    }
  }

  // no-orphaned-images: only in strict mode (serve = '-')
  if (input.strict) {
    for (const img of imageFiles) {
      const relPath = rel(img);
      // only check images that are in img/ directories
      if (!isInImgDir(relPath)) {
        continue;
      }
      if (!referencedPaths.has(relPath)) {
        diagnostics.push({
          rule: Rule.NoOrphanedImages,
          severity: 'info',
          file: relPath,
          title: 'Unreferenced image',
          detail: `"${img.name}" is not referenced by any markdown file. Remove it if it is no longer needed.`,
        });
      }
    }
  }

  return diagnostics;
}

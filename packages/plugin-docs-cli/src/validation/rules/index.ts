import type { RuleRunner } from '../types.js';
import { checkAssets } from './assets.js';
import { checkCrossFile } from './cross-file.js';
import { checkFilesystem } from './filesystem.js';
import { checkFrontmatter } from './frontmatter.js';
import { checkManifest } from './manifest.js';
import { checkMarkdown } from './markdown.js';
import { checkStubContent } from './stub-content.js';
import { checkWritingStyle } from './style.js';

export const allRules: RuleRunner[] = [
  checkFilesystem,
  checkFrontmatter,
  checkAssets,
  checkMarkdown,
  checkStubContent,
  checkCrossFile,
  checkManifest,
  // last, so writing-style advice renders below the findings an author has to act on
  checkWritingStyle,
];

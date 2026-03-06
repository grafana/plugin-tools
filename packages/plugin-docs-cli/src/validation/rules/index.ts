import type { RuleRunner } from '../types.js';
import { checkAssets } from './assets.js';
import { checkCrossFile } from './cross-file.js';
import { checkFilesystem } from './filesystem.js';
import { checkFrontmatter } from './frontmatter.js';
import { checkManifest } from './manifest.js';
import { checkMarkdown } from './markdown.js';

export const allRules: RuleRunner[] = [
  checkFilesystem,
  checkFrontmatter,
  checkAssets,
  checkMarkdown,
  checkCrossFile,
  checkManifest,
];

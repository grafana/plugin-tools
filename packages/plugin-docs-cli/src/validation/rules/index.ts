import type { RuleRunner } from '../types.js';
import { checkAssets } from './assets.js';
import { checkFilesystem } from './filesystem.js';
import { checkFrontmatter } from './frontmatter.js';
import { checkMarkdown } from './markdown.js';

export const allRules: RuleRunner[] = [checkFilesystem, checkFrontmatter, checkAssets, checkMarkdown];

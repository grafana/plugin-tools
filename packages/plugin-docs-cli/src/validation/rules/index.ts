import type { RuleRunner } from '../types.js';
import { checkFilesystem } from './filesystem.js';
import { checkFrontmatter } from './frontmatter.js';

export const allRules: RuleRunner[] = [checkFilesystem, checkFrontmatter];

import type { RuleCategory } from '../engine.js';
import { filesystemDefinitions, checkFilesystem } from './filesystem.js';

/**
 * All registered rule categories.
 */
export const allRules: RuleCategory[] = [{ definitions: filesystemDefinitions, run: checkFilesystem }];

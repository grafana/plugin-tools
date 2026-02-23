import type { RuleRunner } from '../types.js';
import { checkFilesystem } from './filesystem.js';

export const allRules: RuleRunner[] = [checkFilesystem];

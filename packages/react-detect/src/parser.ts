import { parse, TSESTree } from '@typescript-eslint/typescript-estree';

const PARSER_OPTIONS = {
  jsx: true,
  loc: true,
  range: true,
  comment: false,
  tokens: false,
  ecmaVersion: 'latest' as const,
  sourceType: 'module' as const,
};

export function parseFile(code: string, filePath: string): TSESTree.Program {
  try {
    return parse(code, {
      ...PARSER_OPTIONS,
      filePath,
    });
  } catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

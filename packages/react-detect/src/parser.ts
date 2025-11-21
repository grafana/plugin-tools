import { parse, TSESTree } from '@typescript-eslint/typescript-estree';

export class Parser {
  parse(code: string, filePath: string): TSESTree.Program {
    try {
      return parse(code, {
        filePath,
        jsx: true,
        loc: true,
        range: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
      });
    } catch (error) {
      throw new Error(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  canParse(filePath: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return extensions.some((extension) => filePath.endsWith(extension));
  }
}

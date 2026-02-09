import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';

interface ParseResult {
  ast: recast.types.ASTNode | null;
  error: Error | null;
}

export function parseAsTypescript(source: string): ParseResult {
  try {
    const ast = recast.parse(source, {
      parser: typeScriptParser,
    });
    return { ast, error: null };
  } catch (error: unknown) {
    return { ast: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export function printAST(node: recast.types.ASTNode, optionOverrides: recast.Options): string {
  return recast.print(node, {
    tabWidth: 2,
    trailingComma: true,
    lineTerminator: '\n',
    ...optionOverrides,
  }).code;
}

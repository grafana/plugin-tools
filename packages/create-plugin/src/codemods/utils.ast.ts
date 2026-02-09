import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';

const { builders } = recast.types;
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

export function isValidIdentifier(name: string) {
  return /^[a-z_$][0-9a-z_$]*$/iu.test(name);
}

// Converts a JavaScript value to an AST node that can be used in recast transformations.
export function toASTNode(
  value: unknown
):
  | recast.types.namedTypes.ObjectExpression
  | recast.types.namedTypes.ArrayExpression
  | recast.types.namedTypes.Identifier
  | recast.types.namedTypes.Literal {
  if (value === undefined) {
    return builders.identifier('undefined');
  }

  if (Array.isArray(value)) {
    return builders.arrayExpression(value.map((i) => toASTNode(i)));
  }
  if (value && typeof value === 'object') {
    const props = Object.keys(value).map((key) => {
      const propValue = value[key as keyof typeof value];
      const identifier = isValidIdentifier(key) ? builders.identifier(key) : builders.literal(key);
      return builders.property('init', identifier, toASTNode(propValue));
    });
    return builders.objectExpression(props);
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof RegExp ||
    typeof value === 'bigint' ||
    value === null
  ) {
    return builders.literal(value);
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

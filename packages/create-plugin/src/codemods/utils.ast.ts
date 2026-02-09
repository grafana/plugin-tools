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

export function findStringInArray(arr: recast.types.namedTypes.ArrayExpression, value: string) {
  if (!arr.elements) {
    return -1;
  }

  return arr.elements.findIndex((element) => {
    if (!element) {
      return false;
    }
    if (element.type === 'Literal' || element.type === 'StringLiteral') {
      return element.value === value;
    }
    return false;
  });
}

export function insertArrayElement(
  arr: recast.types.namedTypes.ArrayExpression,
  value: recast.types.namedTypes.ArrayExpression['elements'][number],
  position: 'start' | 'end' | number
) {
  if (!arr.elements) {
    arr.elements = [];
  }

  if (position === 'start') {
    arr.elements.unshift(value);
  } else if (position === 'end') {
    arr.elements.push(value);
  } else {
    arr.elements.splice(position, 0, value);
  }
}

export function isProperty(
  node: recast.types.ASTNode
): node is recast.types.namedTypes.Property | recast.types.namedTypes.ObjectProperty {
  return node.type === 'Property' || node.type === 'ObjectProperty';
}

export function findObjectProperty(obj: recast.types.namedTypes.ObjectExpression, propertyName: string) {
  if (!obj.properties) {
    return null;
  }

  const property = obj.properties.find(
    (prop) =>
      isProperty(prop) &&
      ((prop.key.type === 'Identifier' && prop.key.name === propertyName) ||
        (prop.key.type === 'Literal' && prop.key.value === propertyName) ||
        (prop.key.type === 'StringLiteral' && prop.key.value === propertyName))
  );

  return property;
}

// Used to determine if a string can be used as an identifier without needing to be quoted. e.g. object.foo vs object['foo-bar']
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

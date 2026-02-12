import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';

const { builders } = recast.types;

type ParseResult = { success: true; ast: recast.types.namedTypes.File } | { success: false; error: Error };

export function parseAsTypescript(source: string): ParseResult {
  try {
    const ast = recast.parse(source, {
      parser: typeScriptParser,
    });
    return { success: true, ast };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export function printAST(node: recast.types.ASTNode, optionOverrides?: recast.Options): string {
  return recast.print(node, {
    tabWidth: 2,
    trailingComma: true,
    lineTerminator: '\n',
    quote: 'single',
    ...optionOverrides,
  }).code;
}

export function findVariableDeclaration(
  ast: recast.types.ASTNode,
  variableName: string
): recast.types.namedTypes.VariableDeclarator | null {
  let found = null;

  recast.types.visit(ast, {
    visitVariableDeclarator(path) {
      if (path.node.id.type === 'Identifier' && path.node.id.name === variableName) {
        found = path.node;
        return false; // Stop traversal
      }
      return this.traverse(path);
    },
  });

  return found;
}

export function isProperty(
  node: recast.types.ASTNode
): node is recast.types.namedTypes.Property | recast.types.namedTypes.ObjectProperty {
  return node.type === 'Property' || node.type === 'ObjectProperty';
}

export function findObjectProperty(obj: recast.types.namedTypes.ObjectExpression, propertyName: string) {
  if (!obj.properties) {
    return undefined;
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

export function createImport(
  specifiers: {
    default?: string;
    named?: Array<{ name: string; alias?: string }>;
  },
  modulePath: string
): recast.types.namedTypes.ImportDeclaration {
  const importSpecifiers: Array<
    recast.types.namedTypes.ImportDefaultSpecifier | recast.types.namedTypes.ImportSpecifier
  > = [];

  if (specifiers.default) {
    importSpecifiers.push(builders.importDefaultSpecifier(builders.identifier(specifiers.default)));
  }

  if (specifiers.named) {
    for (const { name, alias } of specifiers.named) {
      importSpecifiers.push(
        builders.importSpecifier(
          builders.identifier(name),
          alias ? builders.identifier(alias) : builders.identifier(name)
        )
      );
    }
  }

  return builders.importDeclaration(importSpecifiers, builders.literal(modulePath));
}

export function insertImports(
  ast: recast.types.namedTypes.File,
  imports: recast.types.namedTypes.ImportDeclaration[]
): void {
  const lastImportIndex = ast.program.body.findLastIndex((node: any) => node.type === 'ImportDeclaration');

  if (lastImportIndex !== -1) {
    ast.program.body.splice(lastImportIndex + 1, 0, ...imports);
  } else {
    ast.program.body.unshift(...imports);
  }
}

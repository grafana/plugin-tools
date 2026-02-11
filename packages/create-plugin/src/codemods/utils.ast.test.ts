import { describe, it, expect } from 'vitest';
import * as recast from 'recast';
import {
  parseAsTypescript,
  printAST,
  findStringInArray,
  insertArrayElement,
  isProperty,
  findObjectProperty,
  getImportFrom,
  createImport,
  updateImport,
  insertImports,
  isValidIdentifier,
  toASTNode,
} from './utils.ast.js';

// Helper to create a simple test AST from source code
function createTestAST(source: string) {
  const result = parseAsTypescript(source);
  if (!result.ast) {
    throw new Error('Failed to parse test source');
  }
  return result.ast;
}

// Helper to find first node of specific type
function findFirstNode<T extends recast.types.namedTypes.Node>(ast: recast.types.ASTNode, nodeType: string): T | null {
  let foundNode: T | null = null;
  recast.types.visit(ast, {
    [`visit${nodeType}`](path: any) {
      foundNode = path.node as T;
      return false; // Stop after finding first match
    },
  });
  return foundNode;
}

describe('utils.ast', () => {
  describe('Array Utilities', () => {
    describe('findStringInArray', () => {
      it('should find the index of a string in an array expression', () => {
        const ast = createTestAST(`const arr = ['foo', 'bar', 'baz'];`);
        const arrayExpr = findFirstNode<recast.types.namedTypes.ArrayExpression>(ast, 'ArrayExpression');
        const index = findStringInArray(arrayExpr!, 'bar');
        expect(index).toBe(1);
      });

      it('should return -1 if the string is not found', () => {
        const ast = createTestAST(`const arr = ['foo', 'bar', 'baz'];`);
        const arrayExpr = findFirstNode<recast.types.namedTypes.ArrayExpression>(ast, 'ArrayExpression');
        const index = findStringInArray(arrayExpr!, 'qux');
        expect(index).toBe(-1);
      });

      it('should return -1 for empty array', () => {
        const ast = createTestAST(`const arr = [];`);
        const arrayExpr = findFirstNode<recast.types.namedTypes.ArrayExpression>(ast, 'ArrayExpression');
        const index = findStringInArray(arrayExpr!, 'foo');
        expect(index).toBe(-1);
      });

      it('should handle arrays with null elements', () => {
        const ast = createTestAST(`const arr = ['foo', , 'bar'];`);
        const arrayExpr = findFirstNode<recast.types.namedTypes.ArrayExpression>(ast, 'ArrayExpression');
        const index = findStringInArray(arrayExpr!, 'bar');
        expect(index).toBe(2);
      });
    });

    describe('insertArrayElement', () => {
      it('should insert at start position', () => {
        const ast = createTestAST(`const arr = ['foo', 'bar'];`);
        const arrayExpr = findFirstNode<recast.types.namedTypes.ArrayExpression>(ast, 'ArrayExpression');

        insertArrayElement(arrayExpr!, { type: 'Literal', value: 'start' }, 'start');

        const output = printAST(ast, {});
        expect(output).toContain(`['start', 'foo', 'bar']`);
      });

      it('should insert at end position', () => {
        const ast = createTestAST(`const arr = ['foo', 'bar'];`);
        const arrayExpr = findFirstNode<recast.types.namedTypes.ArrayExpression>(ast, 'ArrayExpression');

        insertArrayElement(arrayExpr!, { type: 'Literal', value: 'end' }, 'end');

        const output = printAST(ast, {});
        expect(output).toContain(`['foo', 'bar', 'end']`);
      });

      it('should insert at numeric index', () => {
        const ast = createTestAST(`const arr = ['foo', 'baz'];`);
        const arrayExpr = findFirstNode<recast.types.namedTypes.ArrayExpression>(ast, 'ArrayExpression');

        insertArrayElement(arrayExpr!, { type: 'Literal', value: 'bar' }, 1);

        const output = printAST(ast, {});
        expect(output).toContain(`['foo', 'bar', 'baz']`);
      });

      it('should create elements array if missing', () => {
        const arrayExpr: recast.types.namedTypes.ArrayExpression = {
          type: 'ArrayExpression',
          elements: null as any,
        };

        insertArrayElement(arrayExpr, { type: 'Literal', value: 'foo' }, 'start');

        expect(arrayExpr.elements).toEqual([{ type: 'Literal', value: 'foo' }]);
      });
    });
  });

  describe('Property Utilities', () => {
    describe('isProperty', () => {
      it('should return true for Property nodes', () => {
        const ast = createTestAST(`const obj = { foo: 'bar' };`);
        const objExpr = findFirstNode<recast.types.namedTypes.ObjectExpression>(ast, 'ObjectExpression');
        const prop = objExpr!.properties[0];

        expect(isProperty(prop)).toBe(true);
      });

      it('should return false for other node types', () => {
        const ast = createTestAST(`const obj = { ...spread };`);
        const objExpr = findFirstNode<recast.types.namedTypes.ObjectExpression>(ast, 'ObjectExpression');
        const spreadElement = objExpr!.properties[0];

        expect(isProperty(spreadElement)).toBe(false);
      });

      it('should provide type narrowing', () => {
        const ast = createTestAST(`const obj = { foo: 'bar' };`);
        const objExpr = findFirstNode<recast.types.namedTypes.ObjectExpression>(ast, 'ObjectExpression');
        const prop = objExpr!.properties[0];

        if (isProperty(prop)) {
          // TypeScript should know prop is Property | ObjectProperty
          expect(prop.key).toBeDefined();
          expect(prop.value).toBeDefined();
        }
      });
    });

    describe('findObjectProperty', () => {
      it('should find property with Identifier key', () => {
        const ast = createTestAST(`const obj = { foo: 'bar', baz: 'qux' };`);
        const objExpr = findFirstNode<recast.types.namedTypes.ObjectExpression>(ast, 'ObjectExpression');

        const prop = findObjectProperty(objExpr!, 'foo');

        expect(prop).toBeDefined();
        expect(isProperty(prop!)).toBe(true);
      });

      it('should find property with Literal key', () => {
        const ast = createTestAST(`const obj = { 'foo-bar': 'value' };`);
        const objExpr = findFirstNode<recast.types.namedTypes.ObjectExpression>(ast, 'ObjectExpression');

        const prop = findObjectProperty(objExpr!, 'foo-bar');

        expect(prop).toBeDefined();
      });

      it('should return null when property not found', () => {
        const ast = createTestAST(`const obj = { foo: 'bar' };`);
        const objExpr = findFirstNode<recast.types.namedTypes.ObjectExpression>(ast, 'ObjectExpression');

        const prop = findObjectProperty(objExpr!, 'missing');

        expect(prop).toBeUndefined();
      });

      it('should return null for empty object', () => {
        const ast = createTestAST(`const obj = {};`);
        const objExpr = findFirstNode<recast.types.namedTypes.ObjectExpression>(ast, 'ObjectExpression');

        const prop = findObjectProperty(objExpr!, 'foo');

        expect(prop).toBeUndefined();
      });
    });
  });

  describe('Identifier Validation', () => {
    describe('isValidIdentifier', () => {
      it('should accept valid camelCase identifiers', () => {
        expect(isValidIdentifier('camelCase')).toBe(true);
        expect(isValidIdentifier('myVariable')).toBe(true);
      });

      it('should accept valid snake_case identifiers', () => {
        expect(isValidIdentifier('snake_case')).toBe(true);
        expect(isValidIdentifier('my_variable')).toBe(true);
      });

      it('should accept valid PascalCase identifiers', () => {
        expect(isValidIdentifier('PascalCase')).toBe(true);
        expect(isValidIdentifier('MyClass')).toBe(true);
      });

      it('should accept identifiers starting with $ or _', () => {
        expect(isValidIdentifier('$jquery')).toBe(true);
        expect(isValidIdentifier('_private')).toBe(true);
      });

      it('should accept identifiers with numbers (not at start)', () => {
        expect(isValidIdentifier('var1')).toBe(true);
        expect(isValidIdentifier('test123')).toBe(true);
      });

      it('should reject identifiers starting with numbers', () => {
        expect(isValidIdentifier('1variable')).toBe(false);
        expect(isValidIdentifier('9test')).toBe(false);
      });

      it('should reject identifiers with hyphens', () => {
        expect(isValidIdentifier('foo-bar')).toBe(false);
        expect(isValidIdentifier('my-variable')).toBe(false);
      });

      it('should reject identifiers with spaces', () => {
        expect(isValidIdentifier('foo bar')).toBe(false);
        expect(isValidIdentifier('my variable')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(isValidIdentifier('')).toBe(false);
      });
    });
  });

  describe('Value Conversion', () => {
    describe('toASTNode', () => {
      it('should convert string primitives', () => {
        const node = toASTNode('hello');
        expect(node.type).toBe('Literal');
        expect((node as any).value).toBe('hello');
      });

      it('should convert number primitives', () => {
        const node = toASTNode(42);
        expect(node.type).toBe('Literal');
        expect((node as any).value).toBe(42);
      });

      it('should convert boolean primitives', () => {
        const trueNode = toASTNode(true);
        const falseNode = toASTNode(false);
        expect(trueNode.type).toBe('Literal');
        expect((trueNode as any).value).toBe(true);
        expect((falseNode as any).value).toBe(false);
      });

      it('should convert null', () => {
        const node = toASTNode(null);
        expect(node.type).toBe('Literal');
        expect((node as any).value).toBe(null);
      });

      it('should convert undefined to Identifier', () => {
        const node = toASTNode(undefined);
        expect(node.type).toBe('Identifier');
        expect((node as any).name).toBe('undefined');
      });

      it('should convert empty arrays', () => {
        const node = toASTNode([]);
        expect(node.type).toBe('ArrayExpression');
        expect((node as any).elements).toHaveLength(0);
      });

      it('should convert flat arrays', () => {
        const node = toASTNode([1, 2, 3]);
        expect(node.type).toBe('ArrayExpression');
        expect((node as any).elements).toHaveLength(3);
      });

      it('should convert nested arrays', () => {
        const node = toASTNode([1, [2, 3], 4]);
        expect(node.type).toBe('ArrayExpression');
        const elements = (node as any).elements;
        expect(elements).toHaveLength(3);
        expect(elements[1].type).toBe('ArrayExpression');
      });

      it('should convert empty objects', () => {
        const node = toASTNode({});
        expect(node.type).toBe('ObjectExpression');
        expect((node as any).properties).toHaveLength(0);
      });

      it('should convert flat objects', () => {
        const node = toASTNode({ foo: 'bar', baz: 42 });
        expect(node.type).toBe('ObjectExpression');
        expect((node as any).properties).toHaveLength(2);
      });

      it('should convert nested objects', () => {
        const node = toASTNode({ outer: { inner: 'value' } });
        expect(node.type).toBe('ObjectExpression');
        const prop = (node as any).properties[0];
        expect(prop.value.type).toBe('ObjectExpression');
      });

      it('should use Identifier for valid object keys', () => {
        const node = toASTNode({ validKey: 'value' });
        const prop = (node as any).properties[0];
        expect(prop.key.type).toBe('Identifier');
        expect(prop.key.name).toBe('validKey');
      });

      it('should use Literal for invalid object keys', () => {
        const node = toASTNode({ 'invalid-key': 'value' });
        const prop = (node as any).properties[0];
        expect(prop.key.type).toBe('Literal');
        expect(prop.key.value).toBe('invalid-key');
      });

      it('should convert RegExp', () => {
        const node = toASTNode(/test/gi);
        // RegExp gets converted (exact type depends on recast implementation)
        expect(node).toBeDefined();
        expect(node.type).toBeTruthy();
      });

      it('should convert bigint', () => {
        const node = toASTNode(BigInt(123));
        expect(node.type).toBe('Literal');
      });

      it('should throw for unsupported types', () => {
        expect(() => toASTNode(Symbol('test'))).toThrow('Unsupported value type');
        expect(() => toASTNode(() => {})).toThrow('Unsupported value type');
      });
    });
  });

  describe('Import Management', () => {
    describe('createImport', () => {
      it('should create default import only', () => {
        const importDecl = createImport({ default: 'React' }, 'react');

        const ast = createTestAST('');
        ast.program.body = [importDecl];

        const output = printAST(ast, {});
        expect(output).toBe(`import React from 'react';`);
      });

      it('should create named imports only', () => {
        const importDecl = createImport({ named: [{ name: 'useState' }, { name: 'useEffect' }] }, 'react');

        const ast = createTestAST('');
        ast.program.body = [importDecl];

        const output = printAST(ast, {});
        expect(output).toBe(`import { useState, useEffect } from 'react';`);
      });

      it('should create mixed import (default + named)', () => {
        const importDecl = createImport({ default: 'React', named: [{ name: 'useState' }] }, 'react');

        const ast = createTestAST('');
        ast.program.body = [importDecl];

        const output = printAST(ast, {});
        expect(output).toBe(`import React, { useState } from 'react';`);
      });

      it('should create import with alias', () => {
        const importDecl = createImport({ named: [{ name: 'map', alias: 'mapOp' }] }, 'rxjs');

        const ast = createTestAST('');
        ast.program.body = [importDecl];

        const output = printAST(ast, {});
        expect(output).toBe(`import { map as mapOp } from 'rxjs';`);
      });

      it('should create side-effect import with no specifiers', () => {
        const importDecl = createImport({}, 'side-effect-module');

        const ast = createTestAST('');
        ast.program.body = [importDecl];

        const output = printAST(ast, {});
        expect(output).toBe(`import 'side-effect-module';`);
      });
    });

    describe('getImportFrom', () => {
      it('should return null when import does not exist', () => {
        const ast = createTestAST(`import React from 'react';`);

        const result = getImportFrom(ast, 'lodash');

        expect(result).toBeNull();
      });

      it('should return correct import when multiple imports exist', () => {
        const ast = createTestAST(`import React from 'react';\nimport _ from 'lodash';\nimport { map } from 'rxjs';`);

        const lodashImport = getImportFrom(ast, 'lodash');
        const reactImport = getImportFrom(ast, 'react');

        expect(lodashImport?.source.value).toBe('lodash');
        expect(reactImport?.source.value).toBe('react');
      });
    });

    describe('insertImports', () => {
      it('should insert at position 0 when no imports exist', () => {
        const ast = createTestAST(`const x = 1;`);
        const importDecl = createImport({ default: 'React' }, 'react');

        insertImports(ast, [importDecl]);

        const output = printAST(ast, {});
        expect(output).toBe(`import React from 'react';\nconst x = 1;`);
      });

      it('should insert after the last import', () => {
        const ast = createTestAST(`import React from 'react';\nimport _ from 'lodash';\nconst x = 1;`);
        const importDecl = createImport({ named: [{ name: 'map' }] }, 'rxjs');

        insertImports(ast, [importDecl]);

        const output = printAST(ast, {});
        expect(output).toBe(
          `import React from 'react';\nimport _ from 'lodash';\nimport { map } from 'rxjs';\nconst x = 1;`
        );
      });

      it('should insert multiple imports at once', () => {
        const ast = createTestAST(`const x = 1;`);
        const imports = [
          createImport({ default: 'React' }, 'react'),
          createImport({ named: [{ name: 'map' }] }, 'lodash'),
        ];

        insertImports(ast, imports);

        const output = printAST(ast, {});
        expect(output).toBe(`import React from 'react';\nimport { map } from 'lodash';\nconst x = 1;`);
      });
    });

    describe('updateImport', () => {
      it('should throw error when adding default to import that already has default', () => {
        const ast = createTestAST(`import React from 'react';`);
        const existingImport = getImportFrom(ast, 'react');

        expect(() => {
          updateImport(existingImport!, { default: 'React2' });
        }).toThrow('Cannot add default import');
      });

      it('should deduplicate named imports', () => {
        const ast = createTestAST(`import { useState } from 'react';`);
        const existingImport = getImportFrom(ast, 'react');

        updateImport(existingImport!, {
          named: [{ name: 'useState' }, { name: 'useEffect' }],
        });

        const output = printAST(ast, {});
        expect(output).toBe(`import { useState, useEffect } from 'react';`);
      });

      it('should handle import with no specifiers array', () => {
        const ast = createTestAST(`import 'side-effect';`);
        const existingImport = getImportFrom(ast, 'side-effect');

        updateImport(existingImport!, { named: [{ name: 'foo' }] });

        const output = printAST(ast, {});
        expect(output).toBe(`import { foo } from 'side-effect';`);
      });

      it('should add multiple named imports without duplicates', () => {
        const ast = createTestAST(`import { useState, useEffect } from 'react';`);
        const existingImport = getImportFrom(ast, 'react');

        updateImport(existingImport!, {
          named: [{ name: 'useState' }, { name: 'useMemo' }, { name: 'useCallback' }],
        });

        const output = printAST(ast, {});
        expect(output).toBe(`import { useState, useEffect, useMemo, useCallback } from 'react';`);
      });

      it('should add named imports to existing default import', () => {
        const ast = createTestAST(`import React from 'react';`);
        const existingImport = getImportFrom(ast, 'react');

        updateImport(existingImport!, {
          named: [{ name: 'useState' }, { name: 'useEffect' }],
        });

        const output = printAST(ast, {});
        expect(output).toBe(`import React, { useState, useEffect } from 'react';`);
      });
    });
  });
});

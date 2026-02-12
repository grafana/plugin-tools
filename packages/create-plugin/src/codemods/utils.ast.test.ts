import { describe, it, expect } from 'vitest';
import * as recast from 'recast';
import {
  parseAsTypescript,
  printAST,
  isProperty,
  findObjectProperty,
  createImport,
  insertImports,
} from './utils.ast.js';

// Helper to create a simple test AST from source code
function createTestAST(source: string) {
  const result = parseAsTypescript(source);
  if (!result.success) {
    throw new Error(`Failed to parse test source. Error: ${result.error.message}`);
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
  });
});

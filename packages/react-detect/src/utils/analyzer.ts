import { ComponentType, Confidence } from '../types/processors.js';
import { walk } from './ast.js';
import { TSESTree } from '@typescript-eslint/typescript-estree';

export function analyzeConfidence(ast: TSESTree.Program): Confidence {
  let score = 0;
  if (hasReactImport(ast)) {
    score += 3;
  }
  if (hasJSX(ast)) {
    score += 3;
  }
  if (hasHooks(ast)) {
    score += 2;
  }

  if (hasReactComponent(ast)) {
    score += 3;
  }

  if (score >= 6) {
    return 'high';
  }
  if (score >= 3) {
    return 'medium';
  }
  if (score >= 1) {
    return 'low';
  }
  return 'none';
}

export function analyzeComponentType(ast: TSESTree.Program): ComponentType {
  if (hasReactComponent(ast)) {
    return 'class';
  }

  if (hasFunctionComponentPattern(ast)) {
    return 'function';
  }

  return 'unknown';
}

export function hasReactComponent(ast: TSESTree.Program): boolean {
  let found = false;

  walk(ast, (node) => {
    if (
      node.type === 'ClassDeclaration' &&
      node.superClass?.type === 'MemberExpression' &&
      node.superClass.object.type === 'Identifier' &&
      node.superClass.object.name === 'React' &&
      node.superClass.property.type === 'Identifier' &&
      (node.superClass.property.name === 'Component' || node.superClass.property.name === 'PureComponent')
    ) {
      found = true;
    }
  });

  return found;
}

export function hasFunctionComponentPattern(ast: TSESTree.Program): boolean {
  const hasJSXInFile = hasJSX(ast);
  const hasHooksInFile = hasHooks(ast);

  if (!hasJSXInFile && !hasHooksInFile) {
    return false;
  }

  let found = false;
  walk(ast, (node) => {
    if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
      found = true;
    }
  });

  return found;
}

function hasReactImport(ast: TSESTree.Program): boolean {
  let found = false;

  walk(ast, (node) => {
    if (
      node.type === 'ImportDeclaration' &&
      node.source.type === 'Literal' &&
      (node.source.value === 'react' || node.source.value === 'react-dom')
    ) {
      found = true;
    }
  });

  return found;
}

function hasJSX(ast: TSESTree.Program): boolean {
  let found = false;

  walk(ast, (node) => {
    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      found = true;
    }
  });

  return found;
}

function hasHooks(ast: TSESTree.Program): boolean {
  let found = false;

  walk(ast, (node) => {
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name.startsWith('use')) {
      found = true;
    }
  });

  return found;
}

import { TSESTree } from '@typescript-eslint/typescript-estree';
import { RawMatch } from '../types/processors.js';
import { walk, createRawMatch } from '../utils/ast.js';
import { parseFile } from '../parser.js';

export function findPatternMatches(code: string, filePath: string): RawMatch[] {
  const ast = parseFile(code, filePath);
  const matches: RawMatch[] = [];

  matches.push(...findDefaultProps(ast, code, filePath));
  matches.push(...findPropTypes(ast, code, filePath));
  matches.push(...findContextTypes(ast, code, filePath));
  matches.push(...findGetChildContext(ast, code, filePath));
  matches.push(...findSecretInternals(ast, code, filePath));
  matches.push(...findStringRefs(ast, code, filePath));
  matches.push(...findFindDOMNode(ast, code, filePath));
  matches.push(...findReactDOMRender(ast, code, filePath));
  matches.push(...findReactDOMUnmountComponentAtNode(ast, code, filePath));
  matches.push(...findCreateFactory(ast, code, filePath));

  return matches;
}

export function findDefaultProps(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'defaultProps'
    ) {
      matches.push(createRawMatch(node, 'defaultProps', code, filePath));
    }
  });

  return matches;
}

export function findPropTypes(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'propTypes'
    ) {
      matches.push(createRawMatch(node, 'propTypes', code, filePath));
    }
  });

  return matches;
}

export function findContextTypes(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'contextTypes'
    ) {
      matches.push(createRawMatch(node, 'contextTypes', code, filePath));
    }
  });

  return matches;
}

export function findGetChildContext(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'getChildContext'
    ) {
      matches.push(createRawMatch(node, 'getChildContext', code, filePath));
    }
  });

  return matches;
}

export function findSecretInternals(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'MemberExpression' &&
      node.property.type === 'Identifier' &&
      node.property.name === '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'
    ) {
      matches.push(createRawMatch(node, '__SECRET_INTERNALS', code, filePath));
    }
  });

  return matches;
}

export function findStringRefs(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'MemberExpression' &&
      node.object.type === 'ThisExpression' &&
      node.property.type === 'Identifier' &&
      node.property.name === 'refs'
    ) {
      matches.push(createRawMatch(node, 'stringRefs', code, filePath));
    }
  });

  return matches;
}

export function findFindDOMNode(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (node && node.type === 'CallExpression') {
      // React.findDOMNode() or ReactDOM.findDOMNode()
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        (node.callee.object.name === 'ReactDOM' || node.callee.object.name === 'React') &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'findDOMNode'
      ) {
        matches.push(createRawMatch(node, 'findDOMNode', code, filePath));
      }
      // findDOMNode() (direct import)
      else if (node.callee.type === 'Identifier' && node.callee.name === 'findDOMNode') {
        matches.push(createRawMatch(node, 'findDOMNode', code, filePath));
      }
    }
  });

  return matches;
}

export function findReactDOMRender(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (node && node.type === 'CallExpression') {
      // ReactDOM.render()
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'ReactDOM' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'render' &&
        (node.arguments.length === 2 || node.arguments.length === 3)
      ) {
        matches.push(createRawMatch(node, 'ReactDOM.render', code, filePath));
      }
      // render() (direct import from 'react-dom')
      else if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'render' &&
        (node.arguments.length === 2 || node.arguments.length === 3)
      ) {
        matches.push(createRawMatch(node, 'ReactDOM.render', code, filePath));
      }
    }
  });

  return matches;
}

export function findReactDOMUnmountComponentAtNode(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (node && node.type === 'CallExpression') {
      // ReactDOM.unmountComponentAtNode()
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'ReactDOM' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'unmountComponentAtNode' &&
        node.arguments.length === 1
      ) {
        matches.push(createRawMatch(node, 'ReactDOM.unmountComponentAtNode', code, filePath));
      }
      // unmountComponentAtNode() (direct import)
      else if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'unmountComponentAtNode' &&
        node.arguments.length === 1
      ) {
        matches.push(createRawMatch(node, 'ReactDOM.unmountComponentAtNode', code, filePath));
      }
    }
  });

  return matches;
}

export function findCreateFactory(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (node && node.type === 'CallExpression') {
      // React.createFactory()
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'React' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'createFactory' &&
        node.arguments.length === 1
      ) {
        matches.push(createRawMatch(node, 'createFactory', code, filePath));
      }
      // createFactory() (direct import)
      else if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'createFactory' &&
        node.arguments.length === 1
      ) {
        matches.push(createRawMatch(node, 'createFactory', code, filePath));
      }
    }
  });

  return matches;
}

import { TSESTree } from '@typescript-eslint/typescript-estree';
import { PatternMatch } from '../types/processors.js';
import { getSurroundingCode, walk } from '../utils/ast.js';

export function findPatternMatches(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  matches.push(...findDefaultProps(ast, code));
  matches.push(...findPropTypes(ast, code));
  matches.push(...findContextTypes(ast, code));
  matches.push(...findGetChildContext(ast, code));
  matches.push(...findSecretInternals(ast, code));
  matches.push(...findStringRefs(ast, code));
  matches.push(...findFindDOMNode(ast, code));
  matches.push(...findReactDOMRender(ast, code));
  matches.push(...findReactDOMUnmountComponentAtNode(ast, code));
  matches.push(...findCreateFactory(ast, code));

  return matches;
}

export function findDefaultProps(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'defaultProps'
    ) {
      matches.push(createPatternMatch(node, 'defaultProps', code));
    }
  });

  return matches;
}

export function findPropTypes(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'propTypes'
    ) {
      matches.push(createPatternMatch(node, 'propTypes', code));
    }
  });

  return matches;
}

export function findContextTypes(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'contextTypes'
    ) {
      matches.push(createPatternMatch(node, 'contextTypes', code));
    }
  });

  return matches;
}

export function findGetChildContext(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'getChildContext'
    ) {
      matches.push(createPatternMatch(node, 'getChildContext', code));
    }
  });

  return matches;
}

export function findSecretInternals(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'MemberExpression' &&
      node.property.type === 'Identifier' &&
      node.property.name === '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'
    ) {
      matches.push(createPatternMatch(node, '__SECRET_INTERNALS', code));
    }
  });

  return matches;
}

export function findStringRefs(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'MemberExpression' &&
      node.object.type === 'ThisExpression' &&
      node.property.type === 'Identifier' &&
      node.property.name === 'refs'
    ) {
      matches.push(createPatternMatch(node, 'stringRefs', code));
    }
  });

  return matches;
}

export function findFindDOMNode(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

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
        matches.push(createPatternMatch(node, 'findDOMNode', code));
      }
      // findDOMNode() (direct import)
      else if (node.callee.type === 'Identifier' && node.callee.name === 'findDOMNode') {
        matches.push(createPatternMatch(node, 'findDOMNode', code));
      }
    }
  });

  return matches;
}

export function findReactDOMRender(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

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
        matches.push(createPatternMatch(node, 'ReactDOM.render', code));
      }
      // render() (direct import from 'react-dom')
      else if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'render' &&
        (node.arguments.length === 2 || node.arguments.length === 3)
      ) {
        matches.push(createPatternMatch(node, 'ReactDOM.render', code));
      }
    }
  });

  return matches;
}

export function findReactDOMUnmountComponentAtNode(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

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
        matches.push(createPatternMatch(node, 'ReactDOM.unmountComponentAtNode', code));
      }
      // unmountComponentAtNode() (direct import)
      else if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'unmountComponentAtNode' &&
        node.arguments.length === 1
      ) {
        matches.push(createPatternMatch(node, 'ReactDOM.unmountComponentAtNode', code));
      }
    }
  });

  return matches;
}

export function findCreateFactory(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

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
        matches.push(createPatternMatch(node, 'createFactory', code));
      }
      // createFactory() (direct import)
      else if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'createFactory' &&
        node.arguments.length === 1
      ) {
        matches.push(createPatternMatch(node, 'createFactory', code));
      }
    }
  });

  return matches;
}

export function createPatternMatch(node: any, pattern: string, code: string): PatternMatch {
  return {
    pattern,
    line: node.loc.start.line,
    column: node.loc.start.column,
    matched: code.slice(node.range[0], node.range[1]),
    context: getSurroundingCode(code, node),
  };
}

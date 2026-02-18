import { TSESTree } from '@typescript-eslint/typescript-estree';
import { PatternMatch } from '../types/processors.js';
import { getSurroundingCode, trackImportsFromPackage, walk } from '../utils/ast.js';

export function findPatternMatches(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  matches.push(...findDefaultProps(ast, code));
  matches.push(...findPropTypes(ast, code));
  matches.push(...findContextTypes(ast, code));
  matches.push(...findGetChildContext(ast, code));
  matches.push(...findSecretInternals(ast, code));
  matches.push(...findJsxRuntimeImports(ast, code));
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
    if (isAssignmentToProperty(node, 'defaultProps')) {
      matches.push(createPatternMatch(node, 'defaultProps', code));
    }
  });

  return matches;
}

export function findPropTypes(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (isAssignmentToProperty(node, 'propTypes')) {
      matches.push(createPatternMatch(node, 'propTypes', code));
    }
  });

  return matches;
}

export function findContextTypes(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (isAssignmentToProperty(node, 'contextTypes')) {
      matches.push(createPatternMatch(node, 'contextTypes', code));
    }
  });

  return matches;
}

export function findGetChildContext(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (isAssignmentToProperty(node, 'getChildContext')) {
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
      node.property.name === '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED' &&
      // Exclude optional chaining like React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher
      !node.optional
    ) {
      matches.push(createPatternMatch(node, '__SECRET_INTERNALS', code));
    }
  });

  return matches;
}

export function findJsxRuntimeImports(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  walk(ast, (node) => {
    if (node && node.type === 'ImportDeclaration') {
      const source = node.source.value;
      if (source === 'react/jsx-runtime' || source === 'react/jsx-dev-runtime') {
        matches.push(createPatternMatch(node, 'jsxRuntimeImport', code));
      }
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
  const imports = trackImportsFromPackage(ast, 'react-dom');
  const findDOMNodeLocalNames = imports.namedImports.get('findDOMNode') || new Set();

  walk(ast, (node: TSESTree.Node) => {
    if (!node || node.type !== 'CallExpression') {
      return;
    }

    if (isMemberExpressionWithIdentifier(node.callee, 'findDOMNode')) {
      const objectName = node.callee.object.name;
      if (imports.defaultImports.has(objectName) || objectName === 'ReactDOM') {
        matches.push(createPatternMatch(node, 'findDOMNode', code));
      }
    }

    // Find findDOMNode(...) if imported from react-dom
    if (node.callee?.type === 'Identifier' && findDOMNodeLocalNames.has(node.callee.name)) {
      matches.push(createPatternMatch(node, 'findDOMNode', code));
    }
  });

  return matches;
}

export function findReactDOMRender(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const imports = trackImportsFromPackage(ast, 'react-dom');
  const renderLocalNames = imports.namedImports.get('render') || new Set();

  walk(ast, (node: TSESTree.Node) => {
    if (!node || node.type !== 'CallExpression') {
      return;
    }

    const hasValidArgs = node.arguments.length === 2 || node.arguments.length === 3;

    if (isMemberExpressionWithIdentifier(node.callee, 'render') && hasValidArgs) {
      const objectName = node.callee.object.name;
      if (imports.defaultImports.has(objectName) || objectName === 'ReactDOM') {
        matches.push(createPatternMatch(node, 'ReactDOM.render', code));
      }
    }

    // Find render(...) if imported from react-dom
    if (node.callee?.type === 'Identifier' && renderLocalNames.has(node.callee.name) && hasValidArgs) {
      matches.push(createPatternMatch(node, 'ReactDOM.render', code));
    }
  });

  return matches;
}

export function findReactDOMUnmountComponentAtNode(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const imports = trackImportsFromPackage(ast, 'react-dom');
  const unmountLocalNames = imports.namedImports.get('unmountComponentAtNode') || new Set();

  walk(ast, (node: TSESTree.Node) => {
    if (!node || node.type !== 'CallExpression') {
      return;
    }

    const hasValidArgs = node.arguments.length === 1;

    if (isMemberExpressionWithIdentifier(node.callee, 'unmountComponentAtNode') && hasValidArgs) {
      const objectName = node.callee.object.name;
      if (imports.defaultImports.has(objectName) || objectName === 'ReactDOM') {
        matches.push(createPatternMatch(node, 'ReactDOM.unmountComponentAtNode', code));
      }
    }

    // Find unmountComponentAtNode(...) if imported from react-dom
    if (node.callee?.type === 'Identifier' && unmountLocalNames.has(node.callee.name) && hasValidArgs) {
      matches.push(createPatternMatch(node, 'ReactDOM.unmountComponentAtNode', code));
    }
  });

  return matches;
}

export function findCreateFactory(ast: TSESTree.Program, code: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const imports = trackImportsFromPackage(ast, 'react');
  const createFactoryLocalNames = imports.namedImports.get('createFactory') || new Set();

  walk(ast, (node: TSESTree.Node) => {
    if (!node || node.type !== 'CallExpression') {
      return;
    }

    const hasValidArgs = node.arguments.length === 1;

    if (isMemberExpressionWithIdentifier(node.callee, 'createFactory') && hasValidArgs) {
      if (imports.defaultImports.has(node.callee.object.name) || node.callee.object.name === 'React') {
        matches.push(createPatternMatch(node, 'createFactory', code));
      }
    }

    // Find createFactory(...) if imported from react
    if (node.callee?.type === 'Identifier' && createFactoryLocalNames.has(node.callee.name) && hasValidArgs) {
      matches.push(createPatternMatch(node, 'createFactory', code));
    }
  });

  return matches;
}

function isMemberExpressionWithIdentifier(
  node: TSESTree.Node | null | undefined,
  propertyName: string
): node is TSESTree.MemberExpression & { property: TSESTree.Identifier; object: TSESTree.Identifier } {
  return (
    node?.type === 'MemberExpression' &&
    node.object?.type === 'Identifier' &&
    node.property?.type === 'Identifier' &&
    node.property.name === propertyName
  );
}

function isAssignmentToProperty(
  node: TSESTree.Node | null | undefined,
  propertyName: string
): node is TSESTree.AssignmentExpression & {
  left: TSESTree.MemberExpression & {
    property: TSESTree.Identifier;
  };
} {
  return (
    node?.type === 'AssignmentExpression' &&
    node.left?.type === 'MemberExpression' &&
    node.left.property?.type === 'Identifier' &&
    node.left.property.name === propertyName
  );
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

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

  if (!hasReactInScope(ast)) {
    return matches;
  }

  // Class component defaultProps is still valid in React 19 — only function components are affected.
  // We build an exclusion set of identifiers that are provably class components so they are skipped,
  // and flag everything else. This works for both unminified source and minified compiled bundles
  // where PascalCase is not a reliable signal.
  const classComponents = collectClassComponentNames(ast);

  walk(ast, (node) => {
    if (
      isAssignmentToProperty(node, 'defaultProps') &&
      node.left.object.type === 'Identifier' &&
      !classComponents.has(node.left.object.name)
    ) {
      matches.push(createPatternMatch(node, 'defaultProps', code));
    }
  });

  return matches;
}

function hasReactInScope(ast: TSESTree.Program): boolean {
  const hasImports = (imports: ReturnType<typeof trackImportsFromPackage>): boolean =>
    imports.defaultImports.size > 0 || imports.namedImports.size > 0;

  return (
    hasImports(trackImportsFromPackage(ast, 'react')) ||
    hasImports(trackImportsFromPackage(ast, 'react/jsx-runtime')) ||
    hasImports(trackImportsFromPackage(ast, 'react/jsx-dev-runtime'))
  );
}

/**
 * Returns the set of identifier names that are provably class components in this file.
 * These are excluded from defaultProps flagging because class component defaultProps
 * is still valid in React 19.
 *
 * Pass 1 collects identifiers from:
 * - Native ES6: `class Foo extends React.Component` / `extends Component`
 * - Babel compiled: `_inherits(Foo, ...)` / `_inheritsLoose(Foo, ...)`
 * - TypeScript compiled: `__extends(Foo, ...)`
 *
 * Pass 2 resolves `_class` aliases found in any sequence expression:
 * - Babel: `(_temp = _class = IIFE, _class.defaultProps = {...}, _temp)`
 * - Factory return: `return _class = IIFE, _class.defaultProps = {...}, _class`
 * - Standalone alias: `(_class = knownComponent, _class.defaultProps = {...})`
 */
function collectClassComponentNames(ast: TSESTree.Program): Set<string> {
  const names = new Set<string>();

  // Pass 1: collect identifiers that are provably class components.
  walk(ast, (node) => {
    if (!node) {
      return;
    }
    // Native class syntax: class Foo extends React.Component or extends Component
    if (
      (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') &&
      node.superClass !== null &&
      isReactBaseClass(node.superClass) &&
      node.id?.type === 'Identifier'
    ) {
      names.add(node.id.name);
    }

    // Babel/TypeScript compiled class inheritance:
    //   _inherits(Foo, ...) / _inheritsLoose(Foo, ...) / __extends(Foo, ...)
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      (node.callee.name === '_inherits' || node.callee.name === '_inheritsLoose' || node.callee.name === '__extends') &&
      node.arguments.length >= 1 &&
      node.arguments[0].type === 'Identifier'
    ) {
      names.add(node.arguments[0].name);
    }
  });

  // Pass 2: resolve _class aliases in any SequenceExpression.
  // Babel assigns the class object to a short-lived alias and then assigns .defaultProps
  // on it within a sequence expression. This pattern appears in VariableDeclarators,
  // return statements, and standalone expression statements. We walk all SequenceExpression
  // nodes regardless of where they appear.
  walk(ast, (node) => {
    if (!node) {
      return;
    }
    if (node.type !== 'SequenceExpression') {
      return;
    }

    // Build identifier → ultimate-assigned-value map, unwrapping chained assignments.
    // For `_temp = _class = IIFE(...)`, both _temp and _class map to the IIFE.
    const assignmentMap = new Map<string, TSESTree.Expression>();
    for (const expr of node.expressions) {
      collectChainedAssignments(expr as TSESTree.Expression, assignmentMap);
    }

    // Promote any identifier that has .defaultProps assigned in this sequence
    // if it was assigned to a known class identifier or a CallExpression (IIFE).
    for (const expr of node.expressions) {
      if (
        expr.type === 'AssignmentExpression' &&
        expr.left.type === 'MemberExpression' &&
        expr.left.object.type === 'Identifier' &&
        expr.left.property.type === 'Identifier' &&
        expr.left.property.name === 'defaultProps'
      ) {
        const alias = expr.left.object.name;
        const value = assignmentMap.get(alias);
        if (value && (value.type === 'CallExpression' || (value.type === 'Identifier' && names.has(value.name)))) {
          names.add(alias);
        }
      }
    }
  });

  return names;
}

/**
 * Recursively walks a (possibly chained) AssignmentExpression and maps each
 * identifier on the left side to the ultimate non-assignment right-hand value.
 *
 * For `_temp = _class = IIFE(...)`:
 *   _temp → IIFE (CallExpression)
 *   _class → IIFE (CallExpression)
 */
function collectChainedAssignments(expr: TSESTree.Expression, map: Map<string, TSESTree.Expression>): void {
  if (expr.type !== 'AssignmentExpression') {
    return;
  }
  if (expr.left.type === 'Identifier') {
    map.set(expr.left.name, getUltimateValue(expr.right as TSESTree.Expression));
  }
  collectChainedAssignments(expr.right as TSESTree.Expression, map);
}

function getUltimateValue(expr: TSESTree.Expression): TSESTree.Expression {
  if (expr.type === 'AssignmentExpression') {
    return getUltimateValue(expr.right as TSESTree.Expression);
  }
  return expr;
}

function isReactBaseClass(node: TSESTree.Expression): boolean {
  // React.Component or React.PureComponent (any namespace alias)
  if (
    node?.type === 'MemberExpression' &&
    node.property.type === 'Identifier' &&
    (node.property.name === 'Component' || node.property.name === 'PureComponent')
  ) {
    return true;
  }

  // Direct named import: extends Component or extends PureComponent
  if (node?.type === 'Identifier' && (node.name === 'Component' || node.name === 'PureComponent')) {
    return true;
  }

  return false;
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
      node.property.name === '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'
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
  const imports = trackImportsFromPackage(ast, 'react');

  const hasReactImport = imports.defaultImports.size > 0 || imports.namedImports.size > 0;
  if (!hasReactImport) {
    return matches;
  }

  walk(ast, (node) => {
    if (
      node &&
      node.type === 'MemberExpression' &&
      node.object?.type === 'MemberExpression' &&
      node.object.object?.type === 'ThisExpression' &&
      node.object.property?.type === 'Identifier' &&
      node.object.property.name === 'refs'
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

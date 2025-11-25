import { TSESTree } from '@typescript-eslint/typescript-estree';
import { RawMatch } from '../types/processors.js';
import { walk, createRawMatch } from '../utils/ast.js';

export function findDefaultProps(ast: TSESTree.Program, code: string, filePath: string): RawMatch[] {
  const matches: RawMatch[] = [];

  walk(ast, (node) => {
    if (
      node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'defaultProps'
    ) {
      matches.push(createRawMatch(node, filePath, 'defaultProps', code));
    }
  });

  return matches;
}

import { RawMatch } from '../types/processors.js';

export function walk(node: any, callback: (node: any) => void): void {
  callback(node);
  for (const key in node) {
    if (node[key] && typeof node[key] === 'object') {
      if (Array.isArray(node[key])) {
        node[key].forEach((child) => walk(child, callback));
      } else if (node[key].type) {
        walk(node[key], callback);
      }
    }
  }
}

function getSurroundingCode(code: string, node: any): string {
  const lines = code.split('\n');
  const startLine = Math.max(0, node.loc.start.line - 3);
  const endLine = Math.min(lines.length, node.loc.end.line + 2);
  return lines.slice(startLine, endLine).join('\n');
}

export function createRawMatch(pattern: string, node: any, code: string, filePath: string): RawMatch {
  return {
    pattern,
    line: node.loc.start.line,
    column: node.loc.start.column,
    matched: code.slice(node.range[0], node.range[1]),
    context: getSurroundingCode(code, node),
    file: filePath,
  };
}

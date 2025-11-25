import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findDefaultProps } from './matcher.js';
import { parseFile } from '../parser.js';
import { inspect } from 'node:util';

describe('findDefaultProps', () => {
  it('should find defaultProps assignments in source code', () => {
    const code = `
      function MyComponent() {}
      MyComponent.defaultProps = { foo: 'bar' };
    `;
    const ast = parseFile(code, 'module.js');
    const matches = findDefaultProps(ast, code, 'module.js');

    expect(matches).toHaveLength(1);
    expect(matches[0].pattern).toBe('defaultProps');
    expect(matches[0].line).toBe(3);
  });

  it('should find defaultProps in bundled code', () => {
    const fixturePath = join(__dirname, '../../test/fixtures/patterns/module.defaultProps.js');
    const code = readFileSync(fixturePath, 'utf-8');
    const ast = parseFile(code, fixturePath);
    const matches = findDefaultProps(ast, code, fixturePath);

    expect(matches).toHaveLength(1);
    expect(matches[0].pattern).toBe('defaultProps');
    expect(matches[0].matched).toContain('defaultProps');
  });
});

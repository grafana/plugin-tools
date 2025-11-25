import { findDefaultProps } from './matcher.js';
import { parseFile } from '../parser.js';

describe('findDefaultProps', () => {
  it('should find defaultProps assignments', () => {
    const code = `
      function MyComponent() {}
      MyComponent.defaultProps = { foo: 'bar' };
    `;
    const ast = parseFile(code, 'module.js');

    console.log();
    const matches = findDefaultProps(ast, code, 'module.js');

    expect(matches).toHaveLength(1);
    expect(matches[0].pattern).toBe('defaultProps');
    expect(matches[0].line).toBe(3);
  });
});

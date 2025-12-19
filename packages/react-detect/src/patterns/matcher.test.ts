import { parseFile } from '../parser.js';
import {
  findDefaultProps,
  findPropTypes,
  findContextTypes,
  findGetChildContext,
  findSecretInternals,
  findStringRefs,
  findFindDOMNode,
  findReactDOMRender,
  findReactDOMUnmountComponentAtNode,
  findCreateFactory,
} from './matcher.js';

describe('matcher', () => {
  describe('findDefaultProps', () => {
    it('should find defaultProps assignments in source code', () => {
      const code = `
      function MyComponent() {}
      MyComponent.defaultProps = { foo: 'bar' };
    `;
      const ast = parseFile(code, 'module.js');
      const matches = findDefaultProps(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('defaultProps');
      expect(matches[0].line).toBe(3);
    });
  });

  describe('findPropTypes', () => {
    it('should find propTypes assignments in source code', () => {
      const code = `
    function MyComponent() {}
    MyComponent.propTypes = { name: PropTypes.string };
  `;
      const ast = parseFile(code, 'test.js');
      const matches = findPropTypes(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('propTypes');
      expect(matches[0].matched).toContain('propTypes');
    });
  });

  describe('findContextTypes', () => {
    it('should find contextTypes assignments in source code', () => {
      const code = `
    class MyComponent extends React.Component {}
    MyComponent.contextTypes = { theme: PropTypes.object };
  `;
      const ast = parseFile(code, 'test.js');
      const matches = findContextTypes(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('contextTypes');
      expect(matches[0].matched).toContain('contextTypes');
    });
  });

  describe('findGetChildContext', () => {
    it('should find getChildContext assignments in source code', () => {
      const code = `
    class MyComponent extends React.Component {
      getChildContext() { return { theme: 'dark' }; }
    }
    MyComponent.getChildContext = function() {};
  `;
      const ast = parseFile(code, 'test.js');
      const matches = findGetChildContext(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('getChildContext');
      expect(matches[0].matched).toContain('getChildContext');
    });
  });

  describe('findSecretInternals', () => {
    it('should find secretInternals assignments in source code', () => {
      const code = `
    const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  `;
      const ast = parseFile(code, 'test.js');
      const matches = findSecretInternals(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('__SECRET_INTERNALS');
      expect(matches[0].matched).toContain('__SECRET_INTERNALS');
    });
  });

  describe('findStringRefs', () => {
    it('should find stringRefs assignments in source code', () => {
      const code = `
    class MyComponent extends React.Component {
      componentDidMount() {
        this.refs.input.focus();
      }
      render() {
        return <input ref="input" />;
      }
    }
  `;
      const ast = parseFile(code, 'test.js');
      const matches = findStringRefs(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('stringRefs');
      expect(matches[0].matched).toContain('this.refs');
    });

    it('should find bracket notation refs access', () => {
      const code = `
      class MyComponent extends React.Component {
        componentDidMount() {
          this.refs['input'].focus();
        }
        render() {
          return <input ref="input" />;
        }
      }
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findStringRefs(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('stringRefs');
      expect(matches[0].matched).toContain('this.refs');
    });
  });

  describe('findFindDOMNode', () => {
    it('should find ReactDOM.findDOMNode calls', () => {
      const code = `
      const node = ReactDOM.findDOMNode(this);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('findDOMNode');
      expect(matches[0].matched).toContain('ReactDOM.findDOMNode');
    });

    it('should find direct findDOMNode calls', () => {
      const code = `
      import { findDOMNode } from 'react-dom';
      const node = findDOMNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('findDOMNode');
    });
  });

  describe('findReactDOMRender', () => {
    it('should find ReactDOM.render with 2 arguments', () => {
      const code = `
      ReactDOM.render(<App />, document.getElementById('root'));
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.render');
      expect(matches[0].matched).toContain('render');
    });

    it('should find ReactDOM.render with 3 arguments (callback)', () => {
      const code = `
      ReactDOM.render(<App />, container, () => console.log('done'));
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.render');
    });
  });

  describe('findReactDOMUnmountComponentAtNode', () => {
    it('should find ReactDOM.unmountComponentAtNode calls', () => {
      const code = `
      ReactDOM.unmountComponentAtNode(container);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.unmountComponentAtNode');
      expect(matches[0].matched).toContain('ReactDOM.unmountComponentAtNode');
    });
  });

  describe('findCreateFactory', () => {
    it('should find React.createFactory', () => {
      const code = `
      const Button = React.createFactory('button');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('createFactory');
      expect(matches[0].matched).toContain('createFactory');
    });
  });
});

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

    it('should match findDOMNode imported from react-dom', () => {
      const code = `
      import { findDOMNode } from 'react-dom';
      const node = findDOMNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('findDOMNode');
      expect(matches[0].line).toBe(3);
    });

    it('should handle renamed imports from react-dom', () => {
      const code = `
      import { findDOMNode as findNode } from 'react-dom';
      const node = findNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('findDOMNode');
      expect(matches[0].line).toBe(3);
      expect(matches[0].matched).toContain('findNode');
    });

    it('should match ReactDOM default import with MemberExpression', () => {
      const code = `
      import ReactDOM from 'react-dom';
      const node = ReactDOM.findDOMNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('findDOMNode');
      expect(matches[0].line).toBe(3);
    });

    it('should match renamed ReactDOM default import', () => {
      const code = `
      import RD from 'react-dom';
      const node = RD.findDOMNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('findDOMNode');
      expect(matches[0].line).toBe(3);
    });

    it('should handle CommonJS require from react-dom', () => {
      const code = `
      const { findDOMNode } = require('react-dom');
      const node = findDOMNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('findDOMNode');
      expect(matches[0].line).toBe(3);
    });

    it('should detect multiple call sites from single import', () => {
      const code = `
      import { findDOMNode } from 'react-dom';
      const node1 = findDOMNode(component1);
      const node2 = findDOMNode(component2);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(3);
      expect(matches[1].line).toBe(4);
    });

    it('should handle mixed patterns from react-dom', () => {
      const code = `
      import ReactDOM from 'react-dom';
      import { findDOMNode } from 'react-dom';
      const node1 = ReactDOM.findDOMNode(component1);
      const node2 = findDOMNode(component2);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(4);
      expect(matches[1].line).toBe(5);
    });

    it('should NOT match local findDOMNode function', () => {
      const code = `
      function findDOMNode(component) {
        return component.element;
      }
      const node = findDOMNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(0);
    });

    it('should NOT match object method with same name', () => {
      const code = `
      const utils = {
        findDOMNode: (component) => component
      };
      const node = utils.findDOMNode(component);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findFindDOMNode(ast, code);

      expect(matches).toHaveLength(0);
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

    it('should match render on imports from ReactDOM', () => {
      const code = `
      import ReactDOM from 'react-dom';
      ReactDOM.render(<App />, document.getElementById('root'));
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.render');
    });

    it('should match render call site, not import statement', () => {
      const code = `
      import { render } from 'react-dom';
      render(<App />, document.getElementById('root'));
      `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.render');
      expect(matches[0].line).toBe(3); // Call site line, not import line (which is line 2)
    });

    it('should match render call site with require, not require statement', () => {
      const code = `
      const { render } = require('react-dom');
      render(<App />, document.getElementById('root'));
      `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.render');
      expect(matches[0].line).toBe(3); // Call site line, not require line (which is line 2)
    });

    it('should handle renamed imports', () => {
      const code = `
      import { render as renderApp } from 'react-dom';
      renderApp(<App />, document.getElementById('root'));
      `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.render');
      expect(matches[0].line).toBe(3);
      expect(matches[0].matched).toContain('renderApp');
    });

    it('should detect multiple render call sites from single import', () => {
      const code = `
      import { render } from 'react-dom';
      render(<App />, document.getElementById('root'));
      render(<AnotherApp />, document.getElementById('another'));
      `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(3);
      expect(matches[1].line).toBe(4);
    });

    it('should not match local render function', () => {
      const code = `
      function render(element, container) {
        return element;
      }
      render(<App />, document.getElementById('root'));
      `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(0);
    });

    it('should handle mixed patterns in same file', () => {
      const code = `
      import ReactDOM from 'react-dom';
      import { render } from 'react-dom';
      ReactDOM.render(<App1 />, document.getElementById('root1'));
      render(<App2 />, document.getElementById('root2'));
      `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(4); // ReactDOM.render call
      expect(matches[1].line).toBe(5); // render call
    });

    it('should not match render with wrong number of arguments', () => {
      const code = `
      import { render } from 'react-dom';
      render(); // 0 arguments
      render(<App />); // 1 argument
      render(<App />, container, callback, extra); // 4 arguments
      `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMRender(ast, code);

      expect(matches).toHaveLength(0);
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

    it('should match unmountComponentAtNode imported from react-dom', () => {
      const code = `
      import { unmountComponentAtNode } from 'react-dom';
      unmountComponentAtNode(container);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.unmountComponentAtNode');
      expect(matches[0].line).toBe(3); // Call site, not import line
    });

    it('should handle renamed imports', () => {
      const code = `
      import { unmountComponentAtNode as unmount } from 'react-dom';
      unmount(container);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.unmountComponentAtNode');
      expect(matches[0].line).toBe(3);
      expect(matches[0].matched).toContain('unmount');
    });

    it('should match default import with MemberExpression', () => {
      const code = `
      import ReactDOM from 'react-dom';
      ReactDOM.unmountComponentAtNode(container);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.unmountComponentAtNode');
      expect(matches[0].line).toBe(3);
    });

    it('should match renamed default import', () => {
      const code = `
      import RD from 'react-dom';
      RD.unmountComponentAtNode(container);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.unmountComponentAtNode');
      expect(matches[0].line).toBe(3);
    });

    it('should handle CommonJS require', () => {
      const code = `
      const { unmountComponentAtNode } = require('react-dom');
      unmountComponentAtNode(container);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('ReactDOM.unmountComponentAtNode');
      expect(matches[0].line).toBe(3);
    });

    it('should detect multiple call sites from single import', () => {
      const code = `
      import { unmountComponentAtNode } from 'react-dom';
      unmountComponentAtNode(container1);
      unmountComponentAtNode(container2);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(3);
      expect(matches[1].line).toBe(4);
    });

    it('should handle mixed patterns in same file', () => {
      const code = `
      import ReactDOM from 'react-dom';
      import { unmountComponentAtNode } from 'react-dom';
      ReactDOM.unmountComponentAtNode(container1);
      unmountComponentAtNode(container2);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(4);
      expect(matches[1].line).toBe(5);
    });

    it('should NOT match local unmountComponentAtNode function', () => {
      const code = `
      function unmountComponentAtNode(container) {
        return container;
      }
      unmountComponentAtNode(container);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(0); // No matches - not from react-dom
    });

    it('should NOT match with invalid argument count (0 args)', () => {
      const code = `
      import { unmountComponentAtNode } from 'react-dom';
      unmountComponentAtNode();
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(0);
    });

    it('should NOT match with invalid argument count (2 args)', () => {
      const code = `
      import { unmountComponentAtNode } from 'react-dom';
      unmountComponentAtNode(container, extra);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findReactDOMUnmountComponentAtNode(ast, code);

      expect(matches).toHaveLength(0);
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

    it('should match createFactory imported from react', () => {
      const code = `
      import { createFactory } from 'react';
      const Button = createFactory('button');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('createFactory');
      expect(matches[0].line).toBe(3); // Call site, not import line
    });

    it('should handle renamed imports', () => {
      const code = `
      import { createFactory as factory } from 'react';
      const Button = factory('button');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('createFactory');
      expect(matches[0].line).toBe(3);
      expect(matches[0].matched).toContain('factory');
    });

    it('should match default import with MemberExpression', () => {
      const code = `
      import React from 'react';
      const Button = React.createFactory('button');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('createFactory');
      expect(matches[0].line).toBe(3);
    });

    it('should match renamed default import', () => {
      const code = `
      import R from 'react';
      const Button = R.createFactory('button');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('createFactory');
      expect(matches[0].line).toBe(3);
    });

    it('should handle CommonJS require', () => {
      const code = `
      const { createFactory } = require('react');
      const Button = createFactory('button');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(1);
      expect(matches[0].pattern).toBe('createFactory');
      expect(matches[0].line).toBe(3);
    });

    it('should detect multiple call sites from single import', () => {
      const code = `
      import { createFactory } from 'react';
      const Button = createFactory('button');
      const Input = createFactory('input');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(3);
      expect(matches[1].line).toBe(4);
    });

    it('should handle mixed patterns in same file', () => {
      const code = `
      import React from 'react';
      import { createFactory } from 'react';
      const Button = React.createFactory('button');
      const Input = createFactory('input');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(4);
      expect(matches[1].line).toBe(5);
    });

    it('should NOT match local createFactory function', () => {
      const code = `
      function createFactory(type) {
        return { type };
      }
      const Button = createFactory('button');
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(0); // No matches - not from react
    });

    it('should NOT match with invalid argument count (0 args)', () => {
      const code = `
      import { createFactory } from 'react';
      const Empty = createFactory();
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(0);
    });

    it('should NOT match with invalid argument count (2 args)', () => {
      const code = `
      import { createFactory } from 'react';
      const Button = createFactory('button', extraArg);
    `;
      const ast = parseFile(code, 'test.js');
      const matches = findCreateFactory(ast, code);

      expect(matches).toHaveLength(0);
    });
  });
});

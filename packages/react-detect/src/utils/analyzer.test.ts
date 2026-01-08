import { describe, it, expect } from 'vitest';
import { parseFile } from '../parser.js';
import { analyzeConfidence, analyzeComponentType, hasReactComponent, hasFunctionComponentPattern } from './analyzer.js';

describe('analyzeConfidence', () => {
  it('should return high for React code with imports and JSX', () => {
    const code = `
      import React from 'react';
      function MyComponent() {
        return <div>Hello</div>;
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeConfidence(ast)).toBe('high');
  });

  it('should return high for class component', () => {
    const code = `
      import React from 'react';
      class MyComponent extends React.Component {
        render() { return <div>Hello</div>; }
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeConfidence(ast)).toBe('high');
  });

  it('should return low for hooks without imports', () => {
    const code = `
      function useCustomHook() {
        const [state, setState] = useState(0);
        return state;
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeConfidence(ast)).toBe('low');
  });

  it('should return medium for JSX without imports', () => {
    const code = `
      function Component() {
        return <div>Hello</div>;
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeConfidence(ast)).toBe('medium');
  });

  it('should return medium for only React import', () => {
    const code = `
      import React from 'react';
      const value = 42;
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeConfidence(ast)).toBe('medium');
  });

  it('should return none for non-React code', () => {
    const code = `
      function regularFunction() {
        return 42;
      }
    `;
    const ast = parseFile(code, 'test.js');
    expect(analyzeConfidence(ast)).toBe('none');
  });
});

describe('analyzeComponentType', () => {
  it('should detect class components extending React.Component', () => {
    const code = `
      import React from 'react';
      class MyComponent extends React.Component {
        render() { return <div>Hello</div>; }
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeComponentType(ast)).toBe('class');
  });

  it('should detect class components extending React.PureComponent', () => {
    const code = `
      import React from 'react';
      class MyComponent extends React.PureComponent {
        render() { return <div>Hello</div>; }
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeComponentType(ast)).toBe('class');
  });

  it('should detect function components with JSX', () => {
    const code = `
      function MyComponent() {
        return <div>Hello</div>;
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeComponentType(ast)).toBe('function');
  });

  it('should detect function components with hooks', () => {
    const code = `
      function MyComponent() {
        const [state] = useState(0);
        return null;
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeComponentType(ast)).toBe('function');
  });

  it('should detect arrow function components', () => {
    const code = `
      const MyComponent = () => {
        return <div>Hello</div>;
      };
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(analyzeComponentType(ast)).toBe('function');
  });

  it('should return unknown for non-component code', () => {
    const code = `
      function regularFunction() {
        return 42;
      }
    `;
    const ast = parseFile(code, 'test.js');
    expect(analyzeComponentType(ast)).toBe('unknown');
  });
});

describe('hasReactComponent', () => {
  it('should detect React.Component', () => {
    const code = `
      class MyComponent extends React.Component {}
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(hasReactComponent(ast)).toBe(true);
  });

  it('should detect React.PureComponent', () => {
    const code = `
      class MyComponent extends React.PureComponent {}
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(hasReactComponent(ast)).toBe(true);
  });

  it('should return false for non-React classes', () => {
    const code = `
      class MyClass extends BaseClass {}
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(hasReactComponent(ast)).toBe(false);
  });
});

describe('hasFunctionComponentPattern', () => {
  it('should detect functions with JSX', () => {
    const code = `
      function MyComponent() {
        return <div>Hello</div>;
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(hasFunctionComponentPattern(ast)).toBe(true);
  });

  it('should detect functions with hooks', () => {
    const code = `
      function MyComponent() {
        const [state] = useState(0);
      }
    `;
    const ast = parseFile(code, 'test.tsx');
    expect(hasFunctionComponentPattern(ast)).toBe(true);
  });

  it('should return false for functions without React patterns', () => {
    const code = `
      function regularFunction() {
        return 42;
      }
    `;
    const ast = parseFile(code, 'test.js');
    expect(hasFunctionComponentPattern(ast)).toBe(false);
  });
});

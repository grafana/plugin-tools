import { describe, it, expect } from 'vitest';
import { ConfidenceScorer } from './confidence-scorer.js';

describe('ConfidenceScorer', () => {
  describe('analyze', () => {
    it('should return medium confidence for code with JSX', () => {
      const code = `
        function MyComponent() {
          return <MyOtherComponent className="test">Hello</MyOtherComponent>;
        }
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      expect(result.confidence).toBe('medium');
      expect(result.reasons).toContain('JSX syntax');
    });

    it('should return medium confidence for code importing from react', () => {
      const code = `
        import React from 'react';
        import { useState } from 'react';
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      expect(result.confidence).toBe('medium');
      expect(result.reasons).toContain('React import');
    });

    it('should return medium confidence for code using React hooks', () => {
      const code = `
        function MyComponent() {
          const [state, setState] = useState(0);
          useEffect(() => {
            console.log('mounted');
          }, []);
        }
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      expect(result.confidence).toBe('medium');
      expect(result.reasons).toContain('React hooks');
    });

    it('should return high confidence for React.Component class', () => {
      const code = `
        class MyComponent extends React.Component {
          render() {
            return <View>Test</View>;
          }
        }
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('should return none for code with only props parameter', () => {
      const code = `
        function MyComponent(props) {
          return props.children;
        }
      `;

      const result = ConfidenceScorer.analyze(code, null);

      // No React indicators detected (props alone is not enough)
      expect(result.isReact).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should return none for code with only React-like method names', () => {
      const code = `
        const obj = {
          componentDidMount: function() {},
          render: function() {}
        };
      `;

      const result = ConfidenceScorer.analyze(code, null);

      // No React indicators detected (method names alone are not checked)
      expect(result.isReact).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should return none for non-React code', () => {
      const code = `
        function sum(a, b) {
          return a + b;
        }
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(false);
      expect(result.confidence).toBe('none');
      expect(result.reasons.length).toBe(0);
    });

    it('should detect React.createElement calls', () => {
      const code = `
        const element = React.createElement('div', null, 'Hello');
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      expect(result.confidence).toBe('medium');
      expect(result.reasons).toContain('React.createElement');
    });

    it('should not detect createContext on its own', () => {
      const code = `
        const MyContext = React.createContext(null);
      `;

      const result = ConfidenceScorer.analyze(code, null);

      // createContext alone is not detected
      expect(result.isReact).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should accumulate multiple indicators', () => {
      const code = `
        import React, { useState } from 'react';

        function MyComponent(props) {
          const [count, setCount] = useState(0);
          return <div>{props.children}</div>;
        }
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.reasons.length).toBeGreaterThan(1);
    });

    it('should handle null or empty code', () => {
      const result1 = ConfidenceScorer.analyze(null, null);
      expect(result1.isReact).toBeNull();
      expect(result1.confidence).toBe('unknown');

      const result2 = ConfidenceScorer.analyze('', null);
      expect(result2.isReact).toBeNull();
      expect(result2.confidence).toBe('unknown');
    });

    it('should handle minified React code', () => {
      const code = `var e=React.createElement,t=React.Component;class n extends t{render(){return e("div",null,"Test")}}`;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('should detect forwardRef with JSX', () => {
      const code = `
        const MyComponent = React.forwardRef((props, ref) => {
          return <View ref={ref}>{props.children}</View>;
        });
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      // JSX gives medium confidence (score 2)
      expect(result.confidence).toBe('medium');
    });

    it('should detect memo usage', () => {
      const code = `
        const MemoizedComponent = React.memo(MyComponent);
      `;

      const result = ConfidenceScorer.analyze(code, null);

      expect(result.isReact).toBe(true);
      // React.memo gives medium confidence (score 3)
      expect(result.confidence).toBe('medium');
    });

    it('should calculate confidence score numerically', () => {
      const highConfidence = `
        import React from 'react';
        function Component() {
          return <div />;
        }
      `;

      const lowConfidence = `
        function componentDidMount() {}
      `;

      const high = ConfidenceScorer.analyze(highConfidence, null);
      const low = ConfidenceScorer.analyze(lowConfidence, null);

      expect(high.score).toBeGreaterThan(low.score);
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return high for scores >= 5', () => {
      const code = `
        import React from 'react';
        <MyComponent />;
      `;
      const result = ConfidenceScorer.analyze(code, null);
      // React import (3) + JSX (2) = 5 = high
      expect(result.confidence).toBe('high');
    });

    it('should return none for scores < 1', () => {
      const code = `function MyComponent(props) { return props.value; }`;
      const result = ConfidenceScorer.analyze(code, null);
      // No React indicators detected
      expect(result.confidence).toBe('none');
    });

    it('should return none for score 0', () => {
      const code = `const x = 1 + 1;`;
      const result = ConfidenceScorer.analyze(code, null);
      expect(result.confidence).toBe('none');
      expect(result.score).toBe(0);
    });
  });
});

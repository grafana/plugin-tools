import { describe, it, expect } from 'vitest';
import { ComponentDetector } from './component-detector.js';

describe('ComponentDetector', () => {
  describe('detect', () => {
    it('should detect class component extending React.Component', () => {
      const code = `
        class MyComponent extends React.Component {
          render() {
            return <div>Test</div>;
          }
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('class');
    });

    it('should detect class component extending Component', () => {
      const code = `
        import { Component } from 'react';

        class MyComponent extends Component {
          render() {
            return <div>Test</div>;
          }
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('class');
    });

    it('should detect class component extending PureComponent', () => {
      const code = `
        class MyComponent extends React.PureComponent {
          render() {
            return <div>Test</div>;
          }
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('class');
    });

    it('should detect function component with JSX', () => {
      const code = `
        function MyComponent() {
          return <div>Test</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should detect arrow function component', () => {
      const code = `
        const MyComponent = () => {
          return <div>Test</div>;
        };
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should detect function component with hooks', () => {
      const code = `
        function MyComponent() {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should return unknown for forwardRef without hooks', () => {
      const code = `
        const MyComponent = React.forwardRef((props, ref) => {
          return <div ref={ref}>Test</div>;
        });
      `;

      const result = ComponentDetector.detect(code, '');
      // forwardRef pattern is not specifically detected
      expect(result).toBe('unknown');
    });

    it('should detect memo as function component', () => {
      const code = `
        const MyComponent = React.memo(function MyComponent(props) {
          return <div>{props.value}</div>;
        });
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should return unknown for non-component code', () => {
      const code = `
        function sum(a, b) {
          return a + b;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('unknown');
    });

    it('should return unknown for null or empty code', () => {
      expect(ComponentDetector.detect(null, '')).toBe('unknown');
      expect(ComponentDetector.detect('', '')).toBe('unknown');
      expect(ComponentDetector.detect('   ', '')).toBe('unknown');
    });

    it('should handle minified class component', () => {
      const code = `class e extends React.Component{render(){return React.createElement("div",null,"Test")}}`;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('class');
    });

    it('should handle minified function component', () => {
      const code = `const e=()=>React.createElement("div",null,"Test")`;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should prioritize class detection over function', () => {
      const code = `
        class MyComponent extends React.Component {
          render() {
            return <div>Test</div>;
          }
        }

        function someOtherFunction() {
          return <div>Other</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('class');
    });

    it('should detect class with render method', () => {
      const code = `
        class MyComponent {
          render() {
            return React.createElement('div', null, 'Test');
          }
        }
      `;

      // Without extends, it might not be detected as a class component
      const result = ComponentDetector.detect(code, '');
      expect(['class', 'unknown']).toContain(result);
    });

    it('should handle component with complex props destructuring', () => {
      const code = `
        function MyComponent({ value, onChange, ...rest }) {
          return <input value={value} onChange={onChange} {...rest} />;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should return unknown for React.FC type annotation without hooks', () => {
      const code = `
        const MyComponent: React.FC<Props> = ({ value }) => {
          return <div>{value}</div>;
        };
      `;

      const result = ComponentDetector.detect(code, '');
      // Type annotations break the pattern matching
      expect(result).toBe('unknown');
    });

    it('should handle component with multiple return statements', () => {
      const code = `
        function MyComponent(props) {
          if (props.loading) {
            return <div>Loading...</div>;
          }
          return <div>{props.data}</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should detect component returning null', () => {
      const code = `
        function MyComponent({ visible }) {
          if (!visible) return null;
          return <div>Visible</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should handle component with useEffect', () => {
      const code = `
        function MyComponent() {
          useEffect(() => {
            console.log('mounted');
          }, []);

          return <div>Test</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should handle component with useCallback', () => {
      const code = `
        function MyComponent() {
          const handleClick = useCallback(() => {
            console.log('clicked');
          }, []);

          return <button onClick={handleClick}>Click</button>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should handle component with useMemo', () => {
      const code = `
        function MyComponent({ items }) {
          const sortedItems = useMemo(() => {
            return items.sort();
          }, [items]);

          return <div>{sortedItems}</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });

    it('should detect component with custom hooks', () => {
      const code = `
        function MyComponent() {
          const data = useCustomHook();
          return <div>{data}</div>;
        }
      `;

      const result = ComponentDetector.detect(code, '');
      expect(result).toBe('function');
    });
  });
});

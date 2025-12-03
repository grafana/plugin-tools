import { PatternDefinition } from '../types/patterns.js';

export const PATTERN_DEFINITIONS: Record<string, PatternDefinition> = {
  __SECRET_INTERNALS: {
    severity: 'renamed',
    impactLevel: 'critical',
    description:
      'React internals renamed from _DO_NOT_USE_OR_YOU_WILL_BE_FIRED to _DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
    fix: {
      description:
        'Check the list of libraries depending on React internals. Either update them or remove them from your dependencies. Alternatively externalise jsx-transform making your plugin compatible with Grafana >=12.3',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#libraries-depending-on-react-internals-may-block-upgrades',
  },
  defaultProps: {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'removed in favour of function components.',
    fix: {
      description: 'Use ES6 default parameters',
      before: 'MyComponent.defaultProps = { value: "test" }',
      after: 'function MyComponent({ value = "test" }) { ... }',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-deprecated-react-apis',
    functionComponentOnly: true,
  },
  propTypes: {
    severity: 'removed',
    impactLevel: 'warning',
    description: 'removed in favour of typescript or other type-checking solution',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-deprecated-react-apis',
    fix: {
      description: 'Run the codemod to migrate to Typescript',
      before: 'npx codemod@latest react/prop-types-typescript',
    },
  },
  createFactory: {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'React.createFactory removed in React 19',
    fix: {
      description: 'Use JSX instead',
      before: "const button = createFactory('button');",
      after: 'const button = <button />;',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-createfactory',
  },
  contextTypes: {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'Legacy Context contextTypes removed in React 19',
    fix: {
      description: 'Migrate to the new contextType API.',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-removing-legacy-context',
  },
  getChildContext: {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'Legacy Context getChildContext removed in React 19',
    fix: {
      description: 'Migrate to the new contextType API.',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-removing-legacy-context',
  },
  findDOMNode: {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'findDOMNode removed from React and ReactDOM in React 19',
    fix: {
      description: 'Use the ref API instead. Use a ref to get the DOM node, or use a forwardRef to get the DOM node.',
      before: 'const node = findDOMNode(this);',
      after: 'const node = useRef(null);',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-finddomnode',
  },
  stringRefs: {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'String refs removed in React 19',
    fix: {
      description: 'Use the ref API instead. Use a ref to get the DOM node, or use a forwardRef to get the DOM node.',
      before: 'const node = this.refs.node;',
      after: 'const node = useRef(null);',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-string-refs',
  },

  'ReactDOM.render': {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'ReactDOM.render removed in React 19 (use createRoot)',
    fix: {
      description: 'Use createRoot instead.',
      before: 'ReactDOM.render(<App />, document.getElementById("root"));',
      after: 'const root = createRoot(document.getElementById("root")); root.render(<App />);',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-render',
  },

  'ReactDOM.unmountComponentAtNode': {
    severity: 'removed',
    impactLevel: 'critical',
    description: 'ReactDOM.unmountComponentAtNode removed in React 19',
    fix: {
      description: 'Use createRoot instead.',
      before: 'ReactDOM.unmountComponentAtNode(container);',
      after: 'const root = createRoot(container); root.unmount();',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-render',
  },
};

export function getPattern(name: string): PatternDefinition | undefined {
  return PATTERN_DEFINITIONS[name];
}

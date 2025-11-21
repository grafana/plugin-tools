import { PatternDefinition } from '../types/patterns.js';

export const PATTERN_DEFINITIONS: Record<string, PatternDefinition> = {
  __SECRET_INTERNALS: {
    pattern: '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED',
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
    pattern: 'defaultProps',
    severity: 'removed',
    impactLevel: 'critical',
    description: 'defaultProps removed for function components in React 19',
    fix: {
      description: 'Use ES6 default parameters',
      before: 'MyComponent.defaultProps = { value: "test" }',
      after: 'function MyComponent({ value = "test" }) { ... }',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-deprecated-react-apis',
    functionComponentOnly: true,
  },
  propTypes: {
    pattern: 'propTypes',
    severity: 'removed',
    impactLevel: 'critical',
    description: 'propTypes removed for function components in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-deprecated-react-apis',
    fix: {
      description: 'Codemod proptypes to Typescript: `npx codemod@latest react/prop-types-typescript`',
    },
  },
  createFactory: {
    pattern: 'createFactory',
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
    pattern: 'contextTypes',
    severity: 'removed',
    impactLevel: 'critical',
    description: 'Legacy Context contextTypes removed in React 19',
    fix: {
      description: 'Migrate to the new contextType API.',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-removing-legacy-context',
  },
  getChildContext: {
    pattern: 'getChildContext',
    severity: 'removed',
    impactLevel: 'critical',
    description: 'Legacy Context getChildContext removed in React 19',
    fix: {
      description: 'Migrate to the new contextType API.',
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-removing-legacy-context',
  },
  findDOMNode: {
    pattern: 'findDOMNode',
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
  'refs[': {
    pattern: 'refs\\[',
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
    pattern: '\\.render',
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
    pattern: 'unmountComponentAtNode',
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

export function getPatternNames(): string[] {
  return Object.keys(PATTERN_DEFINITIONS);
}

export function getPattern(name: string): PatternDefinition | undefined {
  return PATTERN_DEFINITIONS[name];
}

export function isValidPatternName(name: string): boolean {
  return name in PATTERN_DEFINITIONS;
}

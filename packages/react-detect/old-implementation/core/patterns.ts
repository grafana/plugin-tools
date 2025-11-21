import type { Patterns } from '../types.js';

/**
 * React 19 breaking change patterns to detect
 *
 * These patterns identify code that will break or behave differently in React 19.
 * Each pattern includes:
 * - A regex pattern to search for in bundled code
 * - Severity level (removed, renamed, deprecated)
 * - Human-readable description
 * - Link to React 19 upgrade guide
 * - Optional flags for special handling
 */
export const PATTERNS: Patterns = {
  __SECRET_INTERNALS: {
    pattern: '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED',
    severity: 'renamed',
    description: 'React internals renamed from _DO_NOT_USE_OR_YOU_WILL_BE_FIRED to _DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-deprecated-react-apis',
  },

  defaultProps: {
    pattern: '\\.defaultProps=',
    severity: 'removed',
    description: 'defaultProps removed for function components in React 19',
    functionComponentOnly: true,
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-defaultprops-for-function-components',
  },

  propTypes: {
    pattern: '\\.propTypes=',
    severity: 'removed',
    description: 'PropTypes removed from React package in React 19 (use prop-types package)',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-proptypes-and-defaultprops',
  },

  createFactory: {
    pattern: 'createFactory',
    severity: 'removed',
    description: 'React.createFactory removed in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-react-createfactory',
  },

  contextTypes: {
    pattern: 'contextTypes',
    severity: 'removed',
    description: 'Legacy Context contextTypes removed in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-deprecated-react-apis',
  },

  getChildContext: {
    pattern: 'getChildContext',
    severity: 'removed',
    description: 'Legacy Context getChildContext removed in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-deprecated-react-apis',
  },

  'ReactDOM.render': {
    pattern: 'ReactDOM\\.render',
    severity: 'removed',
    description: 'ReactDOM.render removed in React 19 (use createRoot)',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-render',
  },

  'ReactDOM.hydrate': {
    pattern: 'ReactDOM\\.hydrate',
    severity: 'removed',
    description: 'ReactDOM.hydrate removed in React 19 (use hydrateRoot)',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-render',
  },

  'ReactDOM.unmountComponentAtNode': {
    pattern: 'ReactDOM\\.unmountComponentAtNode',
    severity: 'removed',
    description: 'ReactDOM.unmountComponentAtNode removed in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-render',
  },

  'ReactDOM.findDOMNode': {
    pattern: 'ReactDOM\\.findDOMNode',
    severity: 'removed',
    description: 'ReactDOM.findDOMNode removed in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-finddomnode',
  },

  findDOMNode: {
    pattern: 'findDOMNode',
    severity: 'removed',
    description: 'findDOMNode removed in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-finddomnode',
  },

  'refs[': {
    pattern: 'refs\\[',
    severity: 'removed',
    description: 'String refs removed in React 19',
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-string-refs',
  },
};

/**
 * Get all pattern names
 */
export function getPatternNames(): string[] {
  return Object.keys(PATTERNS);
}

/**
 * Get a specific pattern by name
 */
export function getPattern(name: string) {
  return PATTERNS[name];
}

/**
 * Validate that a pattern name exists
 */
export function isValidPatternName(name: string): boolean {
  return name in PATTERNS;
}

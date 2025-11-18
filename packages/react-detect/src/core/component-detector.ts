import type { ComponentType } from '../types.js';

/**
 * Detects whether a React component is a class or function component
 * This is important because some breaking changes (like defaultProps) only affect function components
 */
export class ComponentDetector {
  /**
   * Analyze source code to determine component type
   *
   * @param sourceContent Full source code content
   * @param context The specific line context where the issue was found
   * @returns Component type: 'class', 'function', or 'unknown'
   */
  static detect(sourceContent: string | null, context: string): ComponentType {
    if (!sourceContent) {
      return 'unknown';
    }

    // Check for definitive class component patterns
    if (this.isClassComponent(sourceContent)) {
      return 'class';
    }

    // Check for definitive function component patterns
    if (this.isFunctionComponent(sourceContent)) {
      return 'function';
    }

    // Unable to determine
    return 'unknown';
  }

  /**
   * Check if source code contains class component patterns
   */
  private static isClassComponent(sourceContent: string): boolean {
    const classPatterns = [
      /class\s+\w+\s+extends\s+React\.Component/,
      /class\s+\w+\s+extends\s+Component/,
      /class\s+\w+\s+extends\s+React\.PureComponent/,
      /class\s+\w+\s+extends\s+PureComponent/,
    ];

    const classIndicators = [
      /\bthis\.state\s*=/,
      /\bthis\.props\b/,
      /\bcomponentDidMount\s*\(/,
      /\bcomponentDidUpdate\s*\(/,
      /\bcomponentWillUnmount\s*\(/,
      /\brender\s*\(\s*\)\s*\{/,
      /\bgetDerivedStateFromProps\b/,
      /\bshouldComponentUpdate\s*\(/,
    ];

    // Check for explicit class declarations
    for (const pattern of classPatterns) {
      if (pattern.test(sourceContent)) {
        return true;
      }
    }

    // Check for class lifecycle indicators
    let classScore = 0;
    for (const pattern of classIndicators) {
      if (pattern.test(sourceContent)) {
        classScore++;
      }
    }

    // If we have strong class indicators, it's definitely a class component
    return classScore >= 2;
  }

  /**
   * Check if source code contains function component patterns
   */
  private static isFunctionComponent(sourceContent: string): boolean {
    const functionPatterns = [
      /function\s+\w+\s*\([^)]*\)\s*\{/,
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,
      /const\s+\w+\s*=\s*function\s*\([^)]*\)/,
      /export\s+default\s+function\s+\w+\s*\([^)]*\)/,
      /export\s+function\s+\w+\s*\([^)]*\)/,
    ];

    const functionIndicators = [
      /\buseState\s*\(/,
      /\buseEffect\s*\(/,
      /\buseContext\s*\(/,
      /\buseReducer\s*\(/,
      /\buseCallback\s*\(/,
      /\buseMemo\s*\(/,
      /\buseRef\s*\(/,
      /\buseImperativeHandle\s*\(/,
      /\buseLayoutEffect\s*\(/,
    ];

    // Check for function indicators (hooks are a strong signal)
    let functionScore = 0;
    for (const pattern of functionIndicators) {
      if (pattern.test(sourceContent)) {
        functionScore++;
      }
    }

    // If we have strong hook usage, it's definitely a function component
    if (functionScore >= 2) {
      return true;
    }

    // Check for function patterns combined with JSX return
    for (const pattern of functionPatterns) {
      if (pattern.test(sourceContent)) {
        // Verify it returns JSX
        if (/return\s*\(?\s*</.test(sourceContent)) {
          return true; // JSX return is a strong indicator
        }
        // Also check for React.createElement
        if (/React\.createElement\(/.test(sourceContent)) {
          return true;
        }
      }
    }

    return false;
  }
}

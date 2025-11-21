import type { ReactConfidenceResult, Confidence } from '../types.js';

/**
 * Analyzes code to determine if it's likely React-related
 * This helps reduce false positives by filtering out non-React code
 */
export class ConfidenceScorer {
  /**
   * Analyze source code and path to determine if it's likely React code
   *
   * @param sourceContent Full source code content (if available)
   * @param sourcePath Source file path
   * @returns Confidence analysis result
   */
  static analyze(sourceContent: string | null, sourcePath: string | null): ReactConfidenceResult {
    if (!sourceContent && !sourcePath) {
      return {
        isReact: null,
        confidence: 'unknown',
        reasons: [],
        score: 0,
      };
    }

    const reasons: string[] = [];
    let score = 0;

    // Analyze source content
    if (sourceContent) {
      // Check for React imports (strong signal)
      if (/import\s+.*\s+from\s+['"]react['"]/.test(sourceContent)) {
        reasons.push('React import');
        score += 3;
      }
      if (/require\s*\(\s*['"]react['"]\s*\)/.test(sourceContent)) {
        reasons.push('React require');
        score += 3;
      }

      // Check for React DOM imports
      if (/from\s+['"]react-dom['"]/.test(sourceContent)) {
        reasons.push('ReactDOM import');
        score += 2;
      }

      // Check for JSX syntax (strong signal)
      if (/<[A-Z][a-zA-Z0-9]*[\s\/>]/.test(sourceContent)) {
        reasons.push('JSX syntax');
        score += 2;
      }

      // Check for React hooks (strong signal)
      if (
        /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useImperativeHandle|useLayoutEffect)\s*\(/.test(
          sourceContent
        )
      ) {
        reasons.push('React hooks');
        score += 3;
      }

      // Check for React component patterns
      if (/React\.Component|React\.PureComponent|React\.memo/.test(sourceContent)) {
        reasons.push('React component class');
        score += 3;
      }

      // Check for React.createElement
      if (/React\.createElement/.test(sourceContent)) {
        reasons.push('React.createElement');
        score += 2;
      }
    }

    // Analyze source path
    if (sourcePath) {
      // Check if it's from react package itself (very strong signal)
      if (sourcePath.includes('node_modules/react/') || sourcePath.includes('node_modules/react-dom/')) {
        reasons.push('React package');
        score += 5;
      }

      // Check file extension (moderate signal)
      if (/\.(jsx|tsx)$/.test(sourcePath)) {
        reasons.push('JSX/TSX file');
        score += 2;
      }

      // Check for common React library patterns
      if (sourcePath.includes('node_modules/@react') || sourcePath.includes('node_modules/react-')) {
        reasons.push('React ecosystem package');
        score += 1;
      }
    }

    // Determine confidence based on score
    const { confidence, isReact } = this.scoreToConfidence(score);

    return {
      isReact,
      confidence,
      reasons,
      score,
    };
  }

  /**
   * Convert numeric score to confidence level
   *
   * @param score Numeric confidence score
   * @returns Confidence level and boolean determination
   */
  private static scoreToConfidence(score: number): { confidence: Confidence; isReact: boolean } {
    if (score >= 5) {
      return { confidence: 'high', isReact: true };
    } else if (score >= 2) {
      return { confidence: 'medium', isReact: true };
    } else if (score >= 1) {
      return { confidence: 'low', isReact: true };
    } else {
      return { confidence: 'none', isReact: false };
    }
  }

  /**
   * Check if a confidence level meets a minimum threshold
   *
   * @param confidence The confidence level to check
   * @param minConfidence The minimum required confidence
   * @returns True if the confidence meets the threshold
   */
  static meetsThreshold(confidence: Confidence, minConfidence: Confidence): boolean {
    const levels: Record<Confidence, number> = {
      high: 4,
      medium: 3,
      low: 2,
      none: 1,
      unknown: 0,
    };

    return levels[confidence] >= levels[minConfidence];
  }
}

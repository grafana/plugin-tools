declare module '@coffeeandfun/remove-pii' {
  /**
   * Validation compliance result
   */
  export interface PIIComplianceResult {
    isCompliant: boolean;
    violationCount: number;
  }

  /**
   * Removes personally identifiable information (PII) from text
   * @param text - The text to sanitize
   * @returns Cleaned text with PII removed
   */
  export function removePII(text: string): string;

  /**
   * Validates if text is PII-compliant and provides detailed compliance information
   * @param text - The text to validate
   * @returns Detailed compliance validation result
   */
  export function validatePIICompliance(text: string): PIIComplianceResult;
}

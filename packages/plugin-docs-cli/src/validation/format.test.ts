import { describe, it, expect } from 'vitest';
import { formatResult } from './format.js';
import type { ValidationResult } from './types.js';

describe('formatResult', () => {
  it('should show success for valid result with no diagnostics', () => {
    const result: ValidationResult = { valid: true, diagnostics: [] };
    const output = formatResult(result);
    expect(output).toContain('✓');
    expect(output).toContain('valid');
  });

  it('should show error count and ✗ icon when errors exist', () => {
    const result: ValidationResult = {
      valid: false,
      diagnostics: [{ rule: 'test', severity: 'error', title: 'Bad thing', detail: 'Fix it' }],
    };
    const output = formatResult(result);
    expect(output).toContain('✗');
    expect(output).toContain('1 error');
    expect(output).toContain('Bad thing');
    expect(output).toContain('Fix it');
  });

  it('should show ⚠ icon when only warnings exist', () => {
    const result: ValidationResult = {
      valid: true,
      diagnostics: [{ rule: 'test', severity: 'warning', title: 'Heads up', detail: '' }],
    };
    const output = formatResult(result);
    expect(output).toContain('⚠');
    expect(output).toContain('1 warning');
  });

  it('should pluralize counts correctly', () => {
    const result: ValidationResult = {
      valid: false,
      diagnostics: [
        { rule: 'a', severity: 'error', title: 'A', detail: '' },
        { rule: 'b', severity: 'error', title: 'B', detail: '' },
        { rule: 'c', severity: 'warning', title: 'C', detail: '' },
      ],
    };
    const output = formatResult(result);
    expect(output).toContain('2 errors');
    expect(output).toContain('1 warning');
  });

  it('should include file path when present', () => {
    const result: ValidationResult = {
      valid: false,
      diagnostics: [{ rule: 'test', severity: 'error', file: 'docs/page.md', title: 'Problem', detail: '' }],
    };
    const output = formatResult(result);
    expect(output).toContain('docs/page.md');
  });

  it('should show file:line when line number is present', () => {
    const result: ValidationResult = {
      valid: false,
      diagnostics: [{ rule: 'test', severity: 'error', file: 'page.md', line: 7, title: 'H1', detail: '' }],
    };
    const output = formatResult(result);
    expect(output).toContain('page.md:7');
  });

  it('should handle mixed severities', () => {
    const result: ValidationResult = {
      valid: false,
      diagnostics: [
        { rule: 'a', severity: 'error', title: 'Error', detail: '' },
        { rule: 'b', severity: 'warning', title: 'Warning', detail: '' },
        { rule: 'c', severity: 'info', title: 'Info', detail: '' },
      ],
    };
    const output = formatResult(result);
    expect(output).toContain('1 error');
    expect(output).toContain('1 warning');
    expect(output).toContain('1 info');
  });
});

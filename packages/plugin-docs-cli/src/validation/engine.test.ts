import { describe, it, expect } from 'vitest';
import { validate, type RuleCategory } from './engine.js';
import type { ValidationInput } from './types.js';

describe('validate', () => {
  const input: ValidationInput = { docsPath: '/fake' };

  it('should return valid when no rules are provided', async () => {
    const result = await validate(input, []);
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('should stamp severity from rule definition', async () => {
    const rules: RuleCategory[] = [
      {
        definitions: [{ id: 'test-rule', severity: 'error' }],
        run: () => [{ rule: 'test-rule', title: 'Test', detail: 'Detail' }],
      },
    ];

    const result = await validate(input, rules);
    expect(result.diagnostics[0].severity).toBe('error');
  });

  it('should set valid to false when any diagnostic is an error', async () => {
    const rules: RuleCategory[] = [
      {
        definitions: [{ id: 'err', severity: 'error' }],
        run: () => [{ rule: 'err', title: 'Bad', detail: '' }],
      },
    ];

    const result = await validate(input, rules);
    expect(result.valid).toBe(false);
  });

  it('should set valid to true when all diagnostics are warnings or info', async () => {
    const rules: RuleCategory[] = [
      {
        definitions: [
          { id: 'w', severity: 'warning' },
          { id: 'i', severity: 'info' },
        ],
        run: () => [
          { rule: 'w', title: 'Warn', detail: '' },
          { rule: 'i', title: 'Info', detail: '' },
        ],
      },
    ];

    const result = await validate(input, rules);
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toHaveLength(2);
  });

  it('should handle async rule runners', async () => {
    const rules: RuleCategory[] = [
      {
        definitions: [{ id: 'async-rule', severity: 'error' }],
        run: async () => [{ rule: 'async-rule', title: 'Async', detail: '' }],
      },
    ];

    const result = await validate(input, rules);
    expect(result.diagnostics).toHaveLength(1);
  });

  it('should ignore findings with unknown rule ids', async () => {
    const rules: RuleCategory[] = [
      {
        definitions: [{ id: 'known', severity: 'error' }],
        run: () => [
          { rule: 'unknown', title: 'Ghost', detail: '' },
          { rule: 'known', title: 'Real', detail: '' },
        ],
      },
    ];

    const result = await validate(input, rules);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].rule).toBe('known');
  });
});

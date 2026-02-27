import { describe, it, expect } from 'vitest';
import { validate } from './engine.js';
import type { RuleRunner, ValidationInput } from './types.js';

describe('validate', () => {
  const input: ValidationInput = { docsPath: '/fake', strict: true };

  it('should return valid when no rules are provided', async () => {
    const result = await validate(input, []);
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('should collect diagnostics from runners', async () => {
    const runner: RuleRunner = () => [{ rule: 'test-rule', severity: 'error', title: 'Test', detail: 'Detail' }];

    const result = await validate(input, [runner]);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].severity).toBe('error');
  });

  it('should set valid to false when any diagnostic is an error', async () => {
    const runner: RuleRunner = () => [{ rule: 'err', severity: 'error', title: 'Bad', detail: '' }];

    const result = await validate(input, [runner]);
    expect(result.valid).toBe(false);
  });

  it('should set valid to true when all diagnostics are warnings or info', async () => {
    const runner: RuleRunner = () => [
      { rule: 'w', severity: 'warning', title: 'Warn', detail: '' },
      { rule: 'i', severity: 'info', title: 'Info', detail: '' },
    ];

    const result = await validate(input, [runner]);
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toHaveLength(2);
  });

  it('should handle async rule runners', async () => {
    const runner: RuleRunner = async () => [{ rule: 'async-rule', severity: 'error', title: 'Async', detail: '' }];

    const result = await validate(input, [runner]);
    expect(result.diagnostics).toHaveLength(1);
  });

  it('should collect diagnostics from multiple runners', async () => {
    const runner1: RuleRunner = () => [{ rule: 'a', severity: 'error', title: 'A', detail: '' }];
    const runner2: RuleRunner = () => [{ rule: 'b', severity: 'warning', title: 'B', detail: '' }];

    const result = await validate(input, [runner1, runner2]);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.valid).toBe(false);
  });
});

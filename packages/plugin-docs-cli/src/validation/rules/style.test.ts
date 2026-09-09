import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkWritingStyle, toStyleRuleId, ALLOWED_RULES, REJECTED_RULES, VALE_RULES } from './style.js';
import { validate } from '../engine.js';
import { allRules } from './index.js';
import type { ValidationInput } from '../types.js';

const input = (docsPath: string, overrides: Partial<ValidationInput> = {}): ValidationInput => ({
  docsPath,
  strict: true,
  ...overrides,
});

const md = (body = '') => `---\ntitle: Page\ndescription: A description with enough words in it\n---\n\n${body}`;

async function withDoc(body: string): Promise<string> {
  const tmp = await mkdtemp(join(tmpdir(), 'style-test-'));
  await writeFile(join(tmp, 'index.md'), md(body));
  return tmp;
}

describe('checkWritingStyle', () => {
  it('should return no findings for a nonexistent docs path', async () => {
    expect(await checkWritingStyle(input('/nonexistent/path'))).toHaveLength(0);
  });

  it('should skip repo-meta files such as README.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'style-test-'));
    await writeFile(join(tmp, 'README.md'), md('Configure the datasource.'));
    expect(await checkWritingStyle(input(tmp))).toHaveLength(0);
  });

  describe('rule behaviour', () => {
    // each pair is [rule id, prose that trips it, prose that must not]. the negative case is
    // deliberately the already-correct wording, since that is what the substitution guard protects.
    const cases: Array<[string, string, string]> = [
      ['style-word-list', 'Configure the datasource first.', 'Configure the data source first.'],
      ['style-word-list', 'You need a github account.', 'You need a GitHub account.'],
      ['style-word-list', 'Do this in order to continue.', 'Do this to continue.'],
      ['style-refer-to', 'For more, see [Options](./options.md).', 'For more, refer to [Options](./options.md).'],
      ['style-simple', 'This is a simple change to make.', 'This is a small change to make.'],
      ['style-please', 'Please restart the server now.', 'Restart the server now.'],
      ['style-latin', 'Use a query, e.g. a metric query.', 'Use a query, for example a metric query.'],
      ['style-allows-to', 'This allows to configure the panel.', 'This allows you to configure the panel.'],
      ['style-exclamation', 'That worked great!', 'That worked great.'],
      ['style-and-or', 'Pick tables and/or graphs here.', 'Pick tables, graphs, or both.'],
      ['style-repeated-words', 'This will be be applied later.', 'This is applied later.'],
      ['style-google-em-dash', 'The panel — which is new — renders.', 'The panel, which is new, renders.'],
      ['style-end-to-end', 'Write an E2E test for this.', 'Write an end-to-end test for this.'],
      ['style-dialog-box', 'Open the modal to continue.', 'Open the dialog box to continue.'],
      ['style-timeless', 'This is currently unsupported here.', 'This is unsupported here.'],
    ];

    it.each(cases)('%s should fire on the bad form but not the good one', async (ruleId, bad, good) => {
      const badFindings = await checkWritingStyle(input(await withDoc(bad)));
      expect(badFindings.map((f) => f.rule)).toContain(ruleId);

      const goodFindings = await checkWritingStyle(input(await withDoc(good)));
      expect(goodFindings.map((f) => f.rule)).not.toContain(ruleId);
    });
  });

  describe('scope suppression', () => {
    const offending = 'Configure the datasource.';

    it('should ignore text inside a fenced code block', async () => {
      const tmp = await withDoc(['Some prose here.', '', '```ts', `// ${offending}`, '```'].join('\n'));
      expect(await checkWritingStyle(input(tmp))).toHaveLength(0);
    });

    it('should ignore text inside an inline code span', async () => {
      const tmp = await withDoc('Set the `datasource` field on the panel.');
      expect(await checkWritingStyle(input(tmp))).toHaveLength(0);
    });

    it('should ignore text inside a link target', async () => {
      const tmp = await withDoc('Read the [setup guide](./configure-datasource.md) first.');
      expect(await checkWritingStyle(input(tmp))).toHaveLength(0);
    });

    it('should ignore text inside frontmatter', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'style-test-'));
      await writeFile(
        join(tmp, 'index.md'),
        `---\ntitle: Datasource setup\ndescription: How to configure the datasource for this plugin\n---\n\nAll good here.\n`
      );
      expect(await checkWritingStyle(input(tmp))).toHaveLength(0);
    });

    it('should ignore text inside an HTML comment, including section briefs', async () => {
      const tmp = await withDoc(
        ['<!-- section-brief:start -->', '', `> Fill this in: ${offending}`, '', '<!-- section-brief:end -->'].join(
          '\n'
        )
      );
      expect(await checkWritingStyle(input(tmp))).toHaveLength(0);
    });

    it('should ignore text inside an indented code block', async () => {
      const tmp = await withDoc(['Some prose here.', '', `    const x = 'datasource';`].join('\n'));
      expect(await checkWritingStyle(input(tmp))).toHaveLength(0);
    });
  });

  describe('severity', () => {
    // the invariant that keeps house style from blocking a plugin release. plugin-validator maps a
    // CLI `error` onto analysis.Error, which fails publishing.
    const everyRuleTripped = [
      'Please configure the datasource, e.g. a simple one!',
      'This allows to pick tables and/or graphs, see [Options](./o.md).',
      'It will be be currently unsupported — for now — in the modal.',
    ].join('\n\n');

    it('should never report an error, in either strict mode', async () => {
      const tmp = await withDoc(everyRuleTripped);
      for (const strict of [true, false]) {
        const findings = await checkWritingStyle(input(tmp, { strict }));
        expect(findings.length).toBeGreaterThan(0);
        expect(findings.every((f) => f.severity !== 'error')).toBe(true);
      }
    });

    it('should keep a docs tree valid when its only problems are writing style', async () => {
      // no markdown link here, so the only findings can come from the style rules
      const styleOnly = 'Please configure the datasource, e.g. a simple one!\n\nIt will be be currently in the modal.';
      const tmp = await withDoc(`${styleOnly}\n\n${'Body text to clear the minimum length check. '.repeat(5)}`);
      const result = await validate(input(tmp), allRules);
      const styleFindings = result.diagnostics.filter((d) => d.rule.startsWith('style-'));
      expect(styleFindings.length).toBeGreaterThan(0);
      expect(result.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
      expect(result.valid).toBe(true);
    });

    it('should keep the warn tier at warning in both modes', async () => {
      const tmp = await withDoc('Please restart the server.');
      for (const strict of [true, false]) {
        const findings = await checkWritingStyle(input(tmp, { strict }));
        expect(findings.find((f) => f.rule === 'style-please')!.severity).toBe('warning');
      }
    });

    it('should keep the info tier at info in both modes', async () => {
      const tmp = await withDoc('This is currently unsupported.');
      for (const strict of [true, false]) {
        const findings = await checkWritingStyle(input(tmp, { strict }));
        expect(findings.find((f) => f.rule === 'style-timeless')!.severity).toBe('info');
      }
    });
  });

  describe('noise control', () => {
    it('should cap findings per rule per file', async () => {
      const tmp = await withDoc(
        Array.from({ length: 12 }, (_, i) => `Line ${i} mentions the datasource.`).join('\n\n')
      );
      const findings = await checkWritingStyle(input(tmp));
      expect(findings.filter((f) => f.rule === 'style-word-list')).toHaveLength(5);
    });

    it('should apply a rule-specific lower cap', async () => {
      const tmp = await withDoc(Array.from({ length: 4 }, (_, i) => `Please do step ${i}.`).join('\n\n'));
      const findings = await checkWritingStyle(input(tmp));
      expect(findings.filter((f) => f.rule === 'style-please')).toHaveLength(1);
    });

    it('should not flag future tense on a deprecation line', async () => {
      const tmp = await withDoc('Support will be removed in 12.0.\n\nThe panel will render the series.');
      const findings = await checkWritingStyle(input(tmp)).then((f) => f.filter((x) => x.rule === 'style-google-will'));
      expect(findings).toHaveLength(1);
      expect(findings[0].line).toBeGreaterThan(5);
    });

    it('should honour a rule exception list', async () => {
      const tmp = await withDoc('Enable read-only-mode for this panel.');
      const findings = await checkWritingStyle(input(tmp));
      expect(findings.map((f) => f.rule)).not.toContain('style-google-ly-hyphens');
    });
  });

  describe('diagnostic shape', () => {
    it('should carry a toolkit url so the full rule can be looked up on demand', async () => {
      const tmp = await withDoc('For more, see [Options](./options.md).');
      const finding = (await checkWritingStyle(input(tmp))).find((f) => f.rule === 'style-refer-to');
      expect(finding!.url).toContain('grafana.com/docs/writers-toolkit');
      expect(finding!.file).toBe('index.md');
      expect(finding!.line).toBeGreaterThan(0);
    });

    it('should name the preferred wording in the title', async () => {
      const tmp = await withDoc('Configure the datasource.');
      const finding = (await checkWritingStyle(input(tmp))).find((f) => f.rule === 'style-word-list');
      expect(finding!.title).toContain('data source');
      expect(finding!.title).not.toContain('%s');
    });

    it('should keep the title to a single line', async () => {
      const tmp = await withDoc('Please configure the datasource, e.g. a simple one!');
      for (const finding of await checkWritingStyle(input(tmp))) {
        expect(finding.title).not.toContain('\n');
      }
    });
  });
});

describe('vendored rule integrity', () => {
  it('should derive style ids from the upstream rule name', () => {
    expect(toStyleRuleId('ReferTo')).toBe('style-refer-to');
    expect(toStyleRuleId('GoogleEmDash')).toBe('style-google-em-dash');
    expect(toStyleRuleId('SQL')).toBe('style-sql');
  });

  it('should have a vendored definition for every allowlisted rule', () => {
    const defined = new Set(VALE_RULES.map((r) => r.name));
    for (const name of Object.keys(ALLOWED_RULES)) {
      expect(defined, `${name} is allowlisted but has no vendored definition`).toContain(name);
    }
  });

  it('should not define a rule that is absent from the allowlist', () => {
    for (const rule of VALE_RULES) {
      expect(ALLOWED_RULES, `${rule.name} is defined but not allowlisted`).toHaveProperty(rule.name);
    }
  });

  it('should not both allow and reject the same rule', () => {
    for (const name of Object.keys(ALLOWED_RULES)) {
      expect(REJECTED_RULES).not.toHaveProperty(name);
    }
  });

  it('should document every rule in docs/validation-rules.md', async () => {
    const doc = await readFile(new URL('../../../docs/validation-rules.md', import.meta.url), 'utf-8');
    for (const rule of VALE_RULES) {
      expect(doc, `${toStyleRuleId(rule.name)} is missing from validation-rules.md`).toContain(
        toStyleRuleId(rule.name)
      );
    }
  });
});

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { SNIPPET_NAMES, getSnippetSource } from '@grafana/plugin-docs-parser';
import { Rule } from './types.js';

/**
 * `AGENTS.md` asks whoever changes a rule to update `docs/validation-rules.md` in the same change.
 * That was honour-system until now, and it drifted - three implemented rules went undocumented.
 * These two checks make the instruction enforceable instead of aspirational.
 */
describe('docs/validation-rules.md', () => {
  const docPromise = readFile(new URL('../../docs/validation-rules.md', import.meta.url), 'utf-8');

  // `style-*` ids are derived from the vendored Vale rule names rather than the `Rule` map, so the
  // doc lists them without a matching entry here. See AGENTS.md.
  const isStyleRule = (id: string) => id.startsWith('style-');

  /** Rule ids the doc presents in its tables, i.e. a leading `| \`some-rule\`` cell. */
  async function documentedRuleIds(): Promise<string[]> {
    const doc = await docPromise;
    return [...doc.matchAll(/^\|\s*`([a-z0-9-]+)`/gm)].map((m) => m[1]);
  }

  it('documents every rule the CLI can report', async () => {
    const documented = new Set(await documentedRuleIds());
    const missing = Object.values(Rule).filter((id) => !documented.has(id));

    expect(missing, `implemented but undocumented: ${missing.join(', ')}`).toEqual([]);
  });

  it('does not document rules that no longer exist', async () => {
    const implemented = new Set<string>(Object.values(Rule));
    const stale = (await documentedRuleIds()).filter((id) => !isStyleRule(id) && !implemented.has(id));

    expect(stale, `documented but not implemented: ${stale.join(', ')}`).toEqual([]);
  });
});

describe('docs/snippets.md', () => {
  const docPromise = readFile(new URL('../../docs/snippets.md', import.meta.url), 'utf-8');

  it('lists every snippet the parser knows, and nothing else', async () => {
    const doc = await docPromise;
    const table = doc.split('## Available snippets')[1].split('\n## ')[0];
    const listed = [...table.matchAll(/^\|\s*`([a-z0-9-]+)`/gm)].map((m) => m[1]);

    expect(listed).toEqual([...SNIPPET_NAMES]);
  });

  it('shows the current text of every snippet', async () => {
    const doc = await docPromise;
    const shown = Object.fromEntries(
      [...doc.matchAll(/^### `([a-z0-9-]+)`\n\n(`{3,})markdown\n([\s\S]*?)\n\2$/gm)].map((m) => [m[1], m[3]])
    );
    const current = Object.fromEntries(SNIPPET_NAMES.map((name) => [name, getSnippetSource(name)]));

    expect(shown).toEqual(current);
  });
});

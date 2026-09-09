# AGENTS.md - plugin-docs-cli

Package-specific guidance. See the [repo-root AGENTS.md](../../AGENTS.md) for general conventions.

## Keep the validation rules doc in sync

[docs/validation-rules.md](./docs/validation-rules.md) documents every rule in `src/validation/rules/*.ts` for plugin authors. It is not auto-generated - it must be kept up to date by hand.

- When you add, remove or change a rule (including its severity, or whether it only runs in `--strict` mode), update the matching row in `docs/validation-rules.md` in the same change.
- Write for the plugin author reading the doc, not for someone reading the source: describe what to fix in their docs folder, not which function or file implements the check.
- If a new rule doesn't fit an existing category table, add a new category rather than bolting it onto an unrelated one.
- Keep the rule ID in the table (`` `rule-id` ``) matching the `Rule` map in `src/validation/types.ts` exactly, so it's grep-able against the source.

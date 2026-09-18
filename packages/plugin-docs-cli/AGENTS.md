# AGENTS.md - plugin-docs-cli

Package-specific guidance. See the [repo-root AGENTS.md](../../AGENTS.md) for general conventions.

## Keep the validation rules doc in sync

[docs/validation-rules.md](./docs/validation-rules.md) documents every rule in `src/validation/rules/*.ts` for plugin authors. It is not auto-generated - it must be kept up to date by hand.

- When you add, remove or change a rule (including its severity, or whether it only runs in `--strict` mode), update the matching row in `docs/validation-rules.md` in the same change.
- Write for the plugin author reading the doc, not for someone reading the source: describe what to fix in their docs folder, not which function or file implements the check.
- If a new rule doesn't fit an existing category table, add a new category rather than bolting it onto an unrelated one.
- Keep the rule ID in the table (`` `rule-id` ``) matching the `Rule` map in `src/validation/types.ts` exactly, so it's grep-able against the source - except `style-*` rules, which are intentionally not in `Rule`. See below.

## Writing-style rules

The `style-*` rules live entirely in `src/validation/rules/style.ts`: the `VALE_RULES` data, the
`ALLOWED_RULES`/`REJECTED_RULES` allowlist and the checker that applies them are all one file, on
purpose, so it is obvious where every part of this feature lives.

There is no vendoring script and no separate rule-definition files. `VALE_RULES` is transcribed by
hand, once, from the [Grafana Writers' Toolkit](https://github.com/grafana/writers-toolkit)'s Vale
style files - copying rules from there is rare enough that automating it isn't worth the
indirection. To add or update a rule:

1. Find the rule's `.yml` at
   `https://github.com/grafana/writers-toolkit/blob/main/vale/Grafana/styles/Grafana/<RuleName>.yml`.
2. Translate its fields into a `ValeRule` object literal (`name`, `extends`, `level`, `message`,
   and whichever of `link`, `tokens`, `swap`, `ignorecase`, `nonword`, `exceptions`, `scope` the
   upstream file sets) and add it to `VALE_RULES`, alphabetically by `name`.
3. Add the rule's name to `ALLOWED_RULES` (with a `StyleOverride` if it needs one, see the existing
   entries for examples) or to `REJECTED_RULES` with a one-line reason if you are deliberately not
   running it. Every rule you transcribe must appear in exactly one of the two.
4. Update `docs/validation-rules.md`'s "Writing style" table per the instruction above - the rule
   id is `style-` plus the kebab-case upstream name, so `Grafana.ReferTo` becomes `style-refer-to`.
   Describe what the rule actually matches (check `tokens`/`swap` in `VALE_RULES`), not what the
   upstream rule name suggests - several of these are narrower or different than their name implies.

Only `existence`, `substitution` and `repetition` Vale rules are supported (see `ValeRule.extends`).
Upstream rules implemented as Tengo scripts (`AltText`, `CommandLinePrompts`, `SmartQuotes`,
`Gerunds`) have nothing to transcribe from and would need a native reimplementation instead.

Writing-style rules must never be given a severity above `warning`. `plugin-validator` maps a CLI
`error` onto a publishing block, and Grafana's in-house style is not grounds for refusing a
third-party plugin release.

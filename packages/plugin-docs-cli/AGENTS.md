# AGENTS.md - plugin-docs-cli

Package-specific guidance. See the [repo-root AGENTS.md](../../AGENTS.md) for general conventions.

## What is in this package

- `src/` - the CLI: `serve`, `build` and `validate`. `plugin-validator` runs `validate --json`, so changes to
  its output are a contract change.
- `docs/` - the plugin docs guides. They ship in the published package, see below.

## The `docs/` folder is for plugin authors, not for this repo

`docs/` is published with the package (`files` in `package.json`) and ends up in a plugin's
`node_modules/@grafana/plugin-docs-cli/docs/`. Two kinds of reader use it, and both work inside a plugin
repository, not in this one:

- plugin authors writing their docs
- coding agents working on those docs, pointed there by the `AGENTS.md` that `create-plugin add docs`
  scaffolds

So write for someone who has a plugin and no knowledge of this codebase:

- Describe what to do in their docs folder, not which function or file implements a check.
- Never refer to this repo's layout, tests or conventions from inside `docs/`.
- Use the same text for humans and agents. Don't write "you are an agent" or agent-only sections. What
  agents need beyond the guides (commands for the plugin's package manager) is scaffolded by `create-plugin`.
- Examples use `npm run`. The scaffolded `AGENTS.md` tells agents to substitute the plugin's package manager.

When you change anything a plugin author sees - a command, a flag, what `validate` or `serve` prints, a
validation rule or the markdown the parser supports - update the matching guide in `docs/` in the same
change. Which guide covers what:

- **[validation-rules.md](./docs/validation-rules.md)** documents every rule in `src/validation/rules/*.ts`.
  It is not auto-generated. When you add, remove or change a rule (including its severity, or whether it only
  runs in `--strict` mode), update the matching row in the same change.
- **[supported-markdown.md](./docs/supported-markdown.md)** lists what the parser renders. Update it when the
  supported syntax changes.
- **[README.md](./docs/README.md)** covers the commands and flags, the scripts table, what the codemod
  scaffolds and how docs are validated and published. Update it when those change.
- **[index.md](./docs/index.md)** is the map agents start from. Add a row when you add a guide.
- **`authoring.md`** holds the conventions validation can't check. Don't repeat what a rule
  already enforces.

Two other places depend on file names under `docs/`. If you rename or move a guide, update them:

- `guidesLocation` in `src/utils/utils.guides.ts` points at `docs/README.md`. `validate` prints
  that path.
- The `AGENTS.md` template in `packages/create-plugin/templates/docs/` points agents at
  `node_modules/@grafana/plugin-docs-cli/docs/index.md`.

### Writing the validation rules doc

- Keep the rule ID in the table (`` `rule-id` ``) matching the `Rule` map in `src/validation/types.ts`
  exactly, so it's grep-able against the source. `style-*` rules are the exception, see below.
- If a new rule doesn't fit an existing category table, add a new category rather than bolting it onto an
  unrelated one.

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
4. Update the "Writing style" table in `docs/validation-rules.md`. The rule id is `style-` plus the
   kebab-case upstream name, so `Grafana.ReferTo` becomes `style-refer-to`. Describe what the rule actually
   matches (check `tokens`/`swap` in `VALE_RULES`), not what the upstream rule name suggests - several of
   these are narrower or different than their name implies.

Only `existence`, `substitution` and `repetition` Vale rules are supported (see `ValeRule.extends`).
Upstream rules implemented as Tengo scripts (`AltText`, `CommandLinePrompts`, `SmartQuotes`,
`Gerunds`) have nothing to transcribe from and would need a native reimplementation instead.

Writing-style rules must never be given a severity above `warning`. `plugin-validator` maps a CLI
`error` onto a publishing block, and Grafana's in-house style is not grounds for refusing a
third-party plugin release.

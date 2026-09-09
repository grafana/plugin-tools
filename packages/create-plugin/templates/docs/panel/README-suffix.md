## AI authoring assistance

The authoring conventions for these docs live in `.config/AGENTS/plugin-docs.md` - the page shape, the
judgement calls validation cannot make, which source file backs which page and what belongs on the Overview
tab versus here. Your coding agent picks that up automatically through the plugin's own agent instructions,
so it applies to ordinary editing without you invoking anything.

One skill is scaffolded alongside it: **`bootstrap-plugin-docs`**, a one-shot helper for the initial fill.

### Getting started

Run it once, after scaffolding:

```
/bootstrap-plugin-docs
```

It reads your panel's source plus any existing README content, drafts the stub pages from what it finds and
asks you about anything the source can't answer. Greenfield panels work too - with no README to mine it
leans on source analysis and prompts you for the rest.

### After that

Editing docs is ordinary work. Change a panel option, update `options.md` in the same change. Your agent
already has the conventions, so no special command is needed. Before pushing:

```bash
npm run docs:validate  # strict mode; fails on any error
npm run docs:serve     # local preview on port 3001
```

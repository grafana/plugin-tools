
AI authoring assistance
-----------------------

You scaffolded this plugin with AI agent skills. Four skills live under your
agent loop's skills folder (.claude/skills/, .agents/skills/ or
.cursor/skills/, depending on the loop you picked):

  bootstrap-plugin-docs  - one-shot, plugin-wide. Mines README and source
                           files into the scaffolded stubs, detects soft
                           features and proposes additional pages. Run this
                           first.
  write-plugin-docs      - per-page. Fills a stub page or updates an
                           existing one. Reads the source files implied by
                           the page title and section hints.
  review-plugin-docs     - reviews docs files for frontmatter compliance,
                           style rules, agent-hint cleanup and factual
                           alignment with source.
  validate-plugin-docs   - runs `npm run docs:validate --json`, applies
                           category-based fixes, iterates up to 3 times.

The authoring conventions the skills enforce are documented in docs/AGENTS.md.

Recommended workflow
--------------------

Once, when starting:
  /bootstrap-plugin-docs

This walks through every scaffolded stub plus any README content and fills
them in. Greenfield plugins (no README content) work too - the skill leans
on source-code analysis and prompts you for non-source-backed context.

When adding a new feature later:
  1. Code the feature first (source files, plugin.json edits).
  2. If the feature warrants a new doc page (e.g. you added RBAC roles and
     want to document them):
        /write-plugin-docs <docsPath>/<topic>.md
     The skill catalogs conventional filenames in its step 4 - check there
     for the right name. If there is no conventional fit, pick a kebab-case
     filename and use it.
  3. Update existing pages whose scope changed (e.g. you added a config
     field, so configuration.md needs an update):
        /write-plugin-docs <docsPath>/configuration.md
  4. Review the diff:
        /review-plugin-docs
  5. Validate before pushing:
        /validate-plugin-docs

When updating an existing page:
  Run /write-plugin-docs <page-path> directly. The skill re-reads the
  source files implied by the page title and updates content to match.

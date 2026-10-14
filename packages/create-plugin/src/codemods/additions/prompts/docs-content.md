# Write the catalog docs pages

## Context

`create-plugin add docs` has scaffolded catalog docs for this plugin: stub pages in the docs folder, each section holding a `section-brief` note that says what belongs there. This task fills those stubs from the plugin's source code and migrates any existing documentation (the README and the documents linked from `info.links` in `src/plugin.json`) into them. Then it trims the README back to its pitch.

`create-plugin add docs-content` only checks that catalog docs are set up before handing over these instructions. It changes no files itself, so the working tree starts clean and every change is part of this task.

Throughout, `{docsPath}` means the `docsPath` value in `src/plugin.json` (`catalog-docs` unless the author changed it).

This works on greenfield plugins (no existing docs - drive content from source) and on brownfield plugins (a README full of documentation - move it onto pages, then trim the README back to what the Overview tab needs). Both paths are first-class.

Throughout, "the README" means `src/README.md` when that file exists, and the root `README.md` otherwise. The plugin build ships `src/README.md` when there is one, so it takes precedence: it is the source of the catalog's Overview tab, and the root `README.md` is then only for the repository. Always read and edit `src/README.md` when it exists, and leave the root `README.md` alone.

`index.md` never appears on the Overview tab - it is the Documentation tab's landing page, written for a reader who has already installed the plugin and clicked through from Overview.

Read `{docsPath}/AGENTS.md` before starting and follow it to the authoring guides that ship with `@grafana/plugin-docs-cli`. They hold the frontmatter shape, when to split a page into a folder, how to handle section briefs, the style rules and when the docs are done. Everything specific to the plugin type is in the scaffolded pages and in `{docsPath}/AGENTS.md`: the briefs say what each page holds, and its "Pages and their source" table says which source each page documents. This document only adds what is specific to a first migration.

This is meant to run once, after `add docs`. Ongoing per-page updates are routine work: edit the pages directly against those conventions.

## Check first

Search the docs folder for `section-brief` comments. A section that still has its brief is yours to write. A section without one has been written by the author, so never rewrite it.

If no briefs remain, the pages are already written. Report that, and ask the author whether they want only the README and linked docs migrated: steps 1 and 3, adding that content to the existing pages without rewriting what is there, then steps 7 and 8. Stop if they don't.

Running this again on a plugin that has already been migrated is a normal thing to do.

## Steps

1. Inventory everything available. Read:
   - `src/plugin.json` (plugin type, name, declared `includes`, `info.description`, `info.links`)
   - `src/module.ts` (or `src/module.tsx`), what it registers and the source each page documents, from the "Pages and their source" table in `{docsPath}/AGENTS.md`
   - `provisioning/` if present - bundled dashboards and data sources, often the best source of examples
   - The README (`src/README.md` if it exists, otherwise `README.md`) and `CHANGELOG.md` if present. These may be near-empty boilerplate for fresh plugins - that's fine.
   - Documentation linked from `info.links` in `src/plugin.json`. Walk every entry and read the ones that may hold material for the docs pages: an entry named "Documentation" or "Docs", and any entry that points at a user guide, wiki, docs site or a markdown file such as `TESTING.md` or `CONFIGURATION.md`. Skip links with nothing to harvest, such as issue trackers, support portals and vendor or project home pages. When a link points at a file in this repository (its URL matches the `repository` field in `package.json` or the git remote), read the local file instead of fetching it. Fetch the rest, and note each link you couldn't fetch for the summary.
   - Image assets under `src/img/`, `src/img/screenshots/`, `screenshots/` and `{docsPath}/img/`, plus any image the README or linked docs reference, wherever it lives. Copy usable screenshots into `{docsPath}/img/` during the fill pass and reference them from the pages. If there are none, flag the gap in the final summary.

2. **Build a working understanding from source. This step is mandatory; do not skip even when README is rich.** For each scaffolded page, read the source that `{docsPath}/AGENTS.md` names for it, following the module file into any helpers it calls, and note what the page's briefs ask for. Also note:
   - The plugin's purpose in one sentence, from `info.description`, the module and what it registers.
   - Capabilities worth a feature bullet in the plugin's README, which is the Overview tab. For a panel, these include `setDataSupport` flags such as annotations and alert states, and a suggestions or presets supplier. When step 7 is skipped because the README is the scaffold default, list these bullets in the summary instead.

   If source is genuinely thin (a barely-modified scaffold), say so in the final summary; do not invent.

3. **Plan the README migration.** First decide whether there is anything to migrate. Skip the README part of this step when the README says nothing specific to this plugin. The `create-plugin` scaffold ships a `src/README.md` that is only a title and commented-out guidance, and a generic root `README.md` titled after the plugin type, such as "Grafana panel plugin template", that explains what plugins of that type are in general, plus getting-started and contributing boilerplate. Generic boilerplate is not documentation: do not move it onto pages. The test is whether a sentence would still be true of a different plugin; if so, leave it. Otherwise the README is this plugin's existing documentation and the job is to _move_ it into the docs pages, not to copy it and leave a duplicate behind:
   - For each README section, decide which scaffolded stub page in `{docsPath}` it belongs on.
   - Never drop content. When a section maps to no existing stub, put it on the closest page or on a new page. If it fits nowhere, leave it in the README and list it in the summary.
   - Quote verbatim when the README's existing text already matches the authoring guide's style; rewrite when it does not.
   - Mark what stays behind. Only the pitch survives in the README: what the plugin does, the problem it solves and the feature list. Everything instructional - option tables, data-shape rules, query examples, troubleshooting, configuration walkthroughs - moves to a page.
   - Write the plan down before editing anything, so nothing is dropped between moving it out and trimming the README in step 7.
   - Plan the documentation harvested from `info.links` in step 1 the same way, section by section. Content from another file in this repository is a move, like the README. Content from an external site is a copy, since you can't trim it. Leave out what the README or source already covers, and keep the source understanding from step 2 as the authority when the two disagree, as the contradiction rule in step 6 says.

4. **Add optional pages.** Check the source against the "Optional pages" table in `{docsPath}/AGENTS.md`, and add a page for each trigger you find. When a trigger needs judgement, such as accessibility, add the page only when source clearly supports it.

5. **Ask the author only what you can't work out.** Most runs need no questions. Never ask the author to confirm something that source or the README already answers, such as the plugin's purpose, a link to remove or whether to add a page.

   These docs render on a single, general page on the plugin catalog (`grafana.com/grafana/plugins/{slug}/docs/`), read by anyone evaluating or using the plugin. There's no persona segmentation to ask about - do not ask who the target user is.

   Ask only in these cases:
   - Neither source nor the README says what problem the plugin solves. Ask: "In one sentence, what problem does this plugin solve for users?"
   - The plugin is a panel that reads query data, and source doesn't make the data shape clear. Ask which data shape it expects and which kinds of queries produce it (time series, table, traces, logs).

   Questions never block the work. Ask them all at once, in the session, then keep writing. If no answer arrives, go with what source supports, write down each assumption you made and list them in the final summary so the author can correct them. When the author names a topic that needs its own page, add it.

6. **Write every page** (scaffolded stubs and new pages) as the authoring guides describe, and fill each section that still has a `section-brief` as its brief says. The briefs hold the page formats, so docs read the same across plugins. Use the source understanding as your material, plus README excerpts and linked documentation (when harvested in step 3) and author answers (when given in step 5). Run `docs:validate` after each page, as the authoring guide says, so problems are fixed before the README rewrite.

   **Contradiction rule.** Flag contradictions rather than resolving them, and add each one to the gaps summary in step 10 with file and line references. The author resolves them. There are two kinds:
   - Source contradicts itself. For example, a `description:` string lists option values that don't appear in the matching `options:` array or describes a constraint nothing enforces, or a `defaultValue` matches none of the values its option offers, which is likely a bug. Keep the source text verbatim. Don't paraphrase the discrepancy away or invent corrected wording.
   - The README or linked docs contradict source. For example, they describe an option, a value or a behaviour that the code doesn't have, or that works differently. Document what source does. Check every claim you carry over from the README or linked docs against source before you write it.

7. **Rewrite the README down to its job.** This is `src/README.md` when it exists, and never the root `README.md` in that case. Only once every page from step 6 is written, so no content is lost in transit. Skip this step entirely when you skipped the README part of step 3 - a plugin whose README was already at scaffold default has nothing to migrate and nothing to trim. The README is the Overview tab, seen mostly by people who have not installed the plugin yet and are deciding whether to. It should end up as:
   - One or two paragraphs saying what the plugin does and which problem it solves. Lead with the problem, not the implementation.
   - A short list of features as bullet points - concrete capabilities, one per bullet.
   - A screenshot near the top if the repo has a usable one.
   - Whatever non-documentation sections the project already had and still needs: badges, licence, contributing, support links.

   Delete the instructional sections you moved to pages, and only those. A section that fit on no page stays. Do not leave a condensed copy - two versions of the same guidance drift apart, and the reader is better served by a link. Where the README previously explained something at length, a single sentence pointing into the docs is enough.

   Never delete the README, and never invent a pitch. If the README has no clear statement of purpose and step 2 could not derive one from source, ask the author rather than writing marketing copy for them. Preserve any existing badges, licence text and links verbatim.

8. **Remove documentation links from `info.links` in `src/plugin.json`.** The Documentation tab replaces them, and keeping them would give the catalog page two routes to the docs. Remove each entry named "Documentation" or "Docs", ignoring case, and each entry that points at the README or at a file in this repository whose content you moved to the pages. Don't ask first, and list each removed link in the summary. Leave every other link and the rest of the file as they are. Skip this step when there's no such entry.

9. **Validate** once more with the plugin's `docs:validate` script, and finish as the authoring guide's "Validate" section says.

10. Print a summary for the author as a message in the session. Do this before any other final step, so the author always sees it:
    - Which file you used as the README, `src/README.md` or `README.md`.
    - The sentence you used as the plugin's purpose, and where it came from.
    - Pages drafted from source-only understanding (note when source was thin).
    - Pages drafted with README content layered in.
    - Pages drafted with content from `info.links`, naming the link each came from.
    - Each link you removed from `info.links` in `src/plugin.json`, with its name and URL.
    - Pages drafted from `provisioning/` content.
    - Optional pages you added, and the trigger in source for each.
    - README feature bullets you couldn't add because the README was left as the scaffold default.
    - Pages added from author-named topics.
    - Screenshots copied into `{docsPath}/img/`, and which pages they landed on. Flag pages that would benefit from a screenshot where the repo has none.
    - Gaps flagged for the author:
      - Contradictions found under the contradiction rule, within source and between the README or linked docs and source (cite file and line).
      - Option descriptions you wrote because source had none, so the author can review them.
      - Defaults you couldn't resolve and left as source expressions.
      - Assumptions you made where an author question went unanswered.
      - Purpose unclear from source.
      - README content that fit on no page and stayed in the README.
      - Links in `info.links` you couldn't fetch, and linked content that did not get routed to any page.
      - README sections you removed, and which page each moved to, so the author can spot-check the migration.
    - Final `docs:validate` result.

    End the summary with a note that you didn't take any new screenshots and only reused images already in the repository. Recommend that the author adds screenshots of the plugin in use, starting with the pages you flagged, and references them from those pages.

## Verify

`docs:validate` reports no warnings, as step 9 says. Limit fixes to problems in pages you wrote or changed.

## Out of scope

- Change only files inside `{docsPath}`. There are two exceptions: the README in step 7 (`src/README.md` when it exists), and the documentation links in `info.links` of `src/plugin.json` in step 8. Everything else stays as it is, including `.config/`, source code, dependencies, scripts and workflows.
- Never change source code to fit the docs. When the two disagree, document what the source does and flag the difference in the summary.
- Do not reformat files you did not change.
- Do not leave `TODO` markers in the pages. Anything published in a page is shown to catalog readers, so report gaps in the summary instead.

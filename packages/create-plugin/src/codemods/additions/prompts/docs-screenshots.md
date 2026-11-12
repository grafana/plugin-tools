# Take the screenshots for the catalog docs pages

## Context

The catalog docs pages for this plugin mark where a screenshot belongs with a screenshot marker, an HTML comment on its own line:

```markdown
<!-- screenshot: the panel in grid layout with the "Show series counter" option on -->
```

`create-plugin add docs-content` adds these markers, and authors can add them by hand. This task takes each screenshot from the plugin running in Grafana, saves it in the docs folder and replaces the marker with the image. It also proposes screenshots for other spots where one would clearly help, and takes the ones the author keeps.

`create-plugin add docs-screenshots` has already set up the tools for this:

- `@grafana/plugin-e2e` and `@playwright/test` in `devDependencies`, added or raised to the minimum version when needed, and installed.
- `docs-screenshots/`, a Playwright project with a fixed viewport and theme. When the plugin has its own `playwright.config.ts`, it extends that one, so it uses the same Grafana URL and user as the plugin's e2e tests. Each screenshot is one spec in this folder. The theme is dark, or light when `DOCS_SCREENSHOTS_THEME=light` is set.
- `docs-screenshots/helpers.ts`, which exports `captureDocsScreenshot(target, name)`. It saves a page or an element as `{docsPath}/img/<name>.webp`, returns the path to use on the page and fails when the image is over the docs size limit.
- `docs-screenshots/example.spec.ts`, a skipped example spec to copy, when the folder had no specs yet.
- A `docs:screenshots` script that installs the Chromium browser when it's missing, runs every spec, then runs `docs:validate`.

Throughout, `{docsPath}` means the `docsPath` value in `src/plugin.json`.

Read `{docsPath}/AGENTS.md` before starting and follow it to the authoring guides that ship with `@grafana/plugin-docs-cli`, starting at the `index.md` that `docs:validate` prints on its `Docs guides:` line. Read `screenshots.md` there. It has the rules for screenshots on a page.

## Check first

1. **Find the markers.** Search the pages in `{docsPath}` for `<!-- screenshot:` markers. They start the shot list. Skip `AGENTS.md`, `README.md` and markers inside code blocks, which are examples. A recent `docs:validate` also lists each real marker as a `missing-screenshot` suggestion.
2. **Check that Grafana is running with the plugin.** The URL is `GRAFANA_URL` when it's set and `http://localhost:3000` otherwise.
   - `curl -s <url>/api/health` returns JSON.
   - `curl -s -u admin:admin <url>/api/plugins/<id>/settings` returns 200, where `<id>` is the `id` in `src/plugin.json`.

   When either fails, ask the author to build the plugin and start Grafana, for example with the `dev` and `server` scripts, then wait for them. Don't start Grafana or a watch build yourself, since both keep running.

## Steps

1. **Read what each marker asks for.** For each marker, read the page text around it and the source the page documents, from the "Pages and their source" table in `{docsPath}/AGENTS.md`. Note which page, editor or panel to open, which options to set and what to capture.

2. **Propose more screenshots.** Read every page in `{docsPath}`, apart from `AGENTS.md` and `README.md`, and find spots where a screenshot of the plugin would clearly help a reader and there's no image or marker yet. Write a one-sentence description for each, as a marker would have. Keep it to about one image per page, counting the images and markers already there, and no more than one per section. Good spots:
   - Panel: the panel showing its main options, the options pane and each example that changes how the panel looks.
   - Data source: the config editor, and each query editor mode.
   - App: each page in `includes` and the config page.
   - Skip troubleshooting pages unless an error or empty state is easy to reproduce from provisioned data, and skip sections that explain an idea rather than a part of the UI.

3. **Print the shot list and ask about the proposals** before writing any code. Print two lists, each with the page, the description and the image name: the markers, then your proposals. Name images in lowercase with hyphens after what they show, such as `grid-layout` or `query-editor-builder`. The markers are already agreed. The proposals change pages someone else wrote, so ask the author which to keep and wait for the answer. Take only the proposals they keep. When you have no proposals, don't wait. Go on with the markers.

   When there are no markers and no proposals, there's nothing new to take. If `docs-screenshots/` has specs other than the example, this is a refresh: run `docs:screenshots`, check every image as step 6 says and stop there. Otherwise say there's nothing to do and change nothing.

4. **Write one spec per screenshot** in `docs-screenshots/`, named after the image, such as `grid-layout.spec.ts`. Import `test` and `expect` from `@grafana/plugin-e2e` and `captureDocsScreenshot` from `./helpers`, and follow `example.spec.ts`.
   - Open the UI with the `@grafana/plugin-e2e` fixtures, such as `gotoDashboardPage`, `gotoPanelEditPage`, `createDataSourceConfigPage`, `explorePage` and `gotoAppPage`. `.config/AGENTS/e2e-testing.md` lists them and how to select elements, and the plugin's own tests in `tests/`, if it has any, show what works for this plugin.
   - Start from the dashboards and data sources under `provisioning/` when they show the state you need, with `readProvisionedDashboard` and `gotoDashboardPage` or `gotoPanelEditPage`. That's steadier than building a panel and typing into a query editor. Otherwise use TestData scenarios with fixed values. Set a fixed time range, so the screenshot only changes when the UI does.
   - Wait for what the image shows with `expect(...).toBeVisible()` or a similar check before capturing, so nothing is still loading.
   - Capture the smallest element that shows everything the description names, such as the panel, the options pane or the query editor, rather than the whole page. It's easier to read and stays under the size limit. When the subject is small inside a wide element, capture a tighter element or make the panel smaller, so the image isn't mostly empty space.
   - An element inside a scrolling area, such as the options pane, is cut off at the bottom of the window. When it doesn't fit, make the window taller for that spec with `test.use({ viewport: { width: 1280, height: 1200 } })`, or capture a smaller part of it.
   - When the UI needs a state you can't reproduce from provisioned data or with the fixtures, don't fake it. Skip that screenshot and list it in the summary.

   Delete `example.spec.ts` once the folder has a spec of its own.

5. **Run** the `docs:screenshots` script. When a spec fails, fix the spec. When `captureDocsScreenshot` reports an image over the size limit, capture a smaller element.

6. **Look at every image** you took, with your file or image viewing tool. Check that it shows what its description says and that nothing sensitive is visible. An image is wrong when it ends partway through a control or a label, when something is still loading or when it's mostly empty space. Fix the spec and run it again until the image is right. If you can't view images, say so in the summary and list them for the author to check.

7. **Put each image on its page.** Replace each marker with its image. Insert each kept proposal on its own line next to the text it illustrates, with a blank line before and after. Use the path `captureDocsScreenshot` returned, for example `![The panel in grid layout with the series counter on](./img/grid-layout.webp)`. That path is relative to a page at the top of `{docsPath}`, so on a page in a subfolder, such as `features/`, use `../img/grid-layout.webp` instead. Write alt text that says what the image shows, based on its description and what the image really shows. Leave a marker you couldn't do where it is, and drop a proposal you couldn't do.

8. **Validate** with the `docs:validate` script and fix what it reports for the pages and images you changed. Remove any image under `{docsPath}/img/` that you took and no page uses.

9. **Print a summary** for the author as a message in the session. Do this before any other final step, including any completion step the session asks for, because that step can end the session and the author must have seen the summary by then:
   - The images you took for markers, with the page each landed on.
   - The images you proposed and the author kept, with the page each landed on.
   - The markers you left and the kept proposals you couldn't take, and why.
   - Anything you masked, and why.
   - Images you couldn't check by viewing them.
   - The final `docs:validate` result.

## Secrets rule

Screenshots are published, so treat them like the text of a page:

- Never capture a real credential, token, API key, password, internal hostname or customer data.
- Type only placeholder values into forms, such as `<API_KEY>` or `https://example.com`.
- Pass anything else that's sensitive to `captureDocsScreenshot` in its `mask` option, which covers it with a box.

## Verify

- The `docs:screenshots` script passes.
- `docs:validate` reports no warnings. A `missing-screenshot` suggestion is only left for a marker you listed in the summary.
- Every image a page references under `{docsPath}/img/` that you took comes from a spec in `docs-screenshots/`.

## Out of scope

- Change only files inside `docs-screenshots/` and `{docsPath}/`. Everything else stays as it is, including `.config/`, source code, `tests/`, `provisioning/`, dependencies, scripts and workflows.
- Change pages only to replace markers with images and to insert the proposed images the author kept. Don't rewrite page text.
- Don't create images with an image model or draw mock UI. Every image comes from the running plugin.
- When a spec can't be made to work, leave a `TODO(docs-screenshots):` comment in it saying why, and mark the test with `test.fixme` so the `docs:screenshots` script still passes. Never leave a `TODO` on a page.
- You may use a browser tool, such as a Playwright or Chrome DevTools MCP server, to look around the UI and find selectors. Every image must still come from a spec, so the next refresh can take it again.

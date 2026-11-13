# Screenshots

Screenshots show readers what the plugin looks like before they use it, and make a page much easier
to follow. This guide covers where screenshots go, how to mark the ones still to take and how to take
them from the running plugin.

## Where screenshots go

- Save them in an `img/` folder inside your docs folder and link them from the page with a relative
  path: `![The panel in grid layout](./img/grid-layout.webp)`.
- Use WebP or PNG. Each image can be up to 300KB, and all images together up to 5MB.
- Name files in lowercase with hyphens, such as `query-editor-builder.webp`.
- Write alt text that says what the image shows, not "screenshot".
- Put each image next to the text it illustrates. About one image per page is a good start. More than
  one per section is rarely useful.

[Supported markdown](./supported-markdown.md#images) has the full image syntax, and
[Validation rules](./validation-rules.md#images--other-assets) has every image check.

## Mark a screenshot to take later

When a page needs a screenshot you can't take yet, leave a screenshot marker where the image belongs:

```markdown
<!-- screenshot: the panel in grid layout with the "Show series counter" option on -->
```

- Put the marker on its own line. Describe in one sentence what the image should show.
- One marker is one image.
- Like a section brief, the marker is an HTML comment, so it's never shown in the preview or the catalog.
- `validate` lists every marker as a `missing-screenshot` suggestion. It never fails validation.

To resolve a marker, take the screenshot, save it in `img/` and replace the marker with the image.
Base the alt text on the marker's description and what the image actually shows.

## Take screenshots from the running plugin

Screenshots must come from the real plugin running in Grafana. Don't create images with an image model
and don't draw mock UI.

If your plugin has a `docs:screenshots` script, it was set up by `create-plugin add docs-screenshots`.
Each screenshot is a small Playwright spec in the `docs-screenshots/` folder:

1. Build the plugin and start Grafana, for example with the `dev` and `server` scripts. Set
   `GRAFANA_URL` if Grafana runs somewhere other than `http://localhost:3000`.
2. Add or change the spec for the screenshot. Use the `@grafana/plugin-e2e` fixtures to open the page,
   and `captureDocsScreenshot` from `.config/docs-screenshots/helpers.ts` to save the image. The helper saves a
   WebP file in `img/` and fails when the image is over the size limit.
3. Run `docs:screenshots`. It takes every screenshot, then runs `validate`.
4. Open each new image and check that it shows what the page says, that nothing is cut off and that
   nothing is still loading.

Without that script, take screenshots any way you like, as long as they follow the rules on this page.

## Keep screenshots safe and stable

Screenshots are published, so treat them like the text of a page:

- Never show real credentials, tokens, API keys, internal hostnames or customer data. Type placeholder
  values such as `<API_KEY>` or `https://example.com` into forms, and mask anything else that's sensitive.
- Use provisioned dashboards and data sources, and TestData scenarios with fixed values and a fixed time
  range. Then a screenshot only changes when the UI does.
- Prefer a screenshot of one element, such as the panel or the query editor, to the whole page. It's
  easier to read and stays under the size limit.

## Keep screenshots current

A screenshot is part of the page that shows it, so update it in the same change as the UI. With a
`docs:screenshots` script:

1. After any change to the plugin's UI, run `docs:screenshots`. It takes every screenshot again, so new UI,
   such as a new option in the options pane, shows up without changing a spec.
2. Look at each image that changed. Change a spec only when it fails, or when its image no longer shows what
   the page says, for example because a default changed.
3. When you document a new feature and a picture would help, add a spec for it, or a screenshot marker if
   you can't take it yet.

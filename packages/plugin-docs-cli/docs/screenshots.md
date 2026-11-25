# Screenshots

Screenshots show readers what the plugin looks like and make a page easier to follow. This guide covers where
they go, how to mark the ones still to take and how to take them.

## Where screenshots go

- Save them in an `img/` folder inside your docs folder and link them with a relative path:
  `![The panel in grid layout](./img/grid-layout.webp)`.
- Use WebP or PNG. Each image can be up to 300KB, and all images together up to 5MB.
- Name files in lowercase with hyphens, such as `query-editor-builder.webp`.
- Write alt text that says what the image shows, not "screenshot".
- Put each image next to the text it illustrates. About one per page is a good start, and more than one per
  section is rarely useful.
- Never put an image or a marker between `<!-- snippet:<name> -->` and `<!-- /snippet:<name> -->` markers.
  Grafana replaces everything inside a snippet. Put it before or after instead.

[Supported markdown](./supported-markdown.md#images) has the full image syntax, and
[Validation rules](./validation-rules.md#images--other-assets) has every image check.

## Mark a screenshot to take later

When you can't take a screenshot yet, leave a marker on its own line where the image belongs:

```markdown
<!-- screenshot: the panel in grid layout with the "Show series counter" option on -->
```

- Describe in one sentence what the image shows. Name the page or editor and the options that are set, so
  someone who has never seen the plugin can take it.
- One marker is one image.
- The marker is an HTML comment, so it's never shown in the preview or the catalog.
- `validate` lists every marker as a `missing-screenshot` suggestion. It never fails validation.

To resolve a marker, take the screenshot, save it in `img/` and replace the marker with the image. Base the alt
text on the marker's description and what the image shows.

## Take screenshots from the running plugin

Screenshots must come from the real plugin running in Grafana. Don't create images with an image model or
draw mock UI.

1. Build the plugin and start Grafana with it.
2. Open the page, editor or panel the marker describes and set the options it names.
3. Take the screenshot by hand, with a browser tool such as the Playwright or Chrome DevTools MCP server, or
   with a Playwright script. Save it in `img/` and replace the marker with the image.
4. Open the image and check that it shows what the page says, that nothing is cut off and that nothing is
   still loading.
5. Run `docs:validate`.

## Keep screenshots safe and stable

Screenshots are published, so treat them like the text of a page:

- Never show real credentials, tokens, API keys, internal hostnames or customer data. Type placeholder values
  such as `<API_KEY>` or `https://example.com` into forms, and hide anything else that's sensitive.
- Use provisioned dashboards and data sources, and TestData scenarios with fixed values and a fixed time range.
  Then a screenshot only changes when the UI does.
- Show the screen the way readers see it, with the page title, tabs or editor header that tells them where
  they are. Don't crop to the one control the text describes.
- Use the same window size and theme every time, such as 1280x800 in the dark theme. Long content can run
  past the bottom of the image. Don't stretch the window to fit it.

## Keep screenshots current

A screenshot is part of the page that shows it. When you change the UI, take again each screenshot that shows
it. When you document a new feature that needs a picture, take one or leave a marker.

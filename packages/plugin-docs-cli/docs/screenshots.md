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

Never put an image or a marker between `<!-- snippet:<name> -->` and `<!-- /snippet:<name> -->` markers.
Grafana keeps that text up to date and replaces everything inside it, so the image would be lost. Put it
before or after the snippet. [Snippets](./snippets.md) explains how they work.

[Supported markdown](./supported-markdown.md#images) has the full image syntax, and
[Validation rules](./validation-rules.md#images--other-assets) has every image check.

## Mark a screenshot to take later

When a page needs a screenshot you can't take yet, leave a screenshot marker where the image belongs:

```markdown
<!-- screenshot: the panel in grid layout with the "Show series counter" option on -->
```

- Put the marker on its own line. Describe in one sentence what the image should show.
- Write the description so someone who has never seen the plugin can take the screenshot. Name the page or
  editor, the options that are set and what the image focuses on.
- One marker is one image.
- Like a section brief, the marker is an HTML comment, so it's never shown in the preview or the catalog.
- `validate` lists every marker as a `missing-screenshot` suggestion. It never fails validation.

To resolve a marker, take the screenshot, save it in `img/` and replace the marker with the image.
Base the alt text on the marker's description and what the image actually shows.

## Take screenshots from the running plugin

Screenshots must come from the real plugin running in Grafana. Don't create images with an image model
and don't draw mock UI.

1. Build the plugin and start Grafana with it.
2. Open the page, editor or panel the marker describes and set the options it names.
3. Take the screenshot and save it in `img/`, then replace the marker with the image. Take it by hand, with
   a browser tool such as the Playwright or Chrome DevTools MCP server, or with a Playwright script.
4. Open each new image and check that it shows what the page says, that nothing is cut off and that
   nothing is still loading.
5. Run `docs:validate` to check the image against the rules on this page.

## Keep screenshots safe and stable

Screenshots are published, so treat them like the text of a page:

- Never show real credentials, tokens, API keys, internal hostnames or customer data. Type placeholder
  values such as `<API_KEY>` or `https://example.com` into forms, and hide anything else that's sensitive.
- Use provisioned dashboards and data sources, and TestData scenarios with fixed values and a fixed time
  range. Then a screenshot only changes when the UI does.
- Show the screen the way readers see it, with the page title, tabs, editor header or toolbar that tells
  them where they are. Don't crop to the one form or control the text describes. For an app page or config
  page, that's the page with its title and tabs. For a query editor, it's the query tab or the whole query
  row.
- Use the same window size, theme and data every time, such as 1280x800 in the dark theme. Long content can
  run past the bottom of the image, as it does on screen. Don't stretch the window to fit a long list into
  one tall image.

## Keep screenshots current

A screenshot is part of the page that shows it, so update it in the same change as the UI:

1. After a change to the plugin's UI, check each screenshot that shows it and take it again when it no
   longer matches.
2. When you document a new feature and a picture would help, take one, or leave a screenshot marker if you
   can't take it yet.

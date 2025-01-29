---
id: data-source-configuration
title: Configure data sources
description: A guide to data source configuration.
keywords:
  - grafana
  - data source plugin
  - datasource
  - data source plugin configuration
---

# Best practices for data source plugin configuration

To deliver a consistent and user-friendly experience to Grafana users, we recommend that Grafana plugin developers follow uniform guidelines when building data source plugins. This guide outlines recommended best practices to help you achieve this goal.

## Logos

If your plugin requires a logo, follow these recommendations:

- Ensure you obtain permission from the trademark holder.
- Follow the brand guidelines, typically available in a company’s media kit or press kit.
- Use logos with a transparent background, avoiding white backgrounds.
- Logos should be in SVG format.

**Example:** [MongoDB](https://www.mongodb.com/company/newsroom/brand-resources)  
**Example:** [Datadog](https://www.datadoghq.com/about/resources/)

## Description and required fields

We recommend using the `DataSourceDescription` component from the [@grafana/plugin-ui](https://github.com/grafana/plugin-ui) repository. The plugin name and documentation link are required, but details about other fields is optional. The plugin name and documentation link are required, but details about other fields is optional.

For required fields, avoid manually typing `*`. Instead, pass the `required` prop to the `InlineField` component. This prop automatically adds a `*` to the label.

**Example of DataSourceDescription component:**

![Description](/img/data-source-config/config-data-source-description.png)

**Example of required field:**

![Connection](/img/data-source-config/config-connection.png)

## Sections

Divide the data source configuration page into multiple sections using the `ConfigSection` component.

- The `section` description property is optional but recommended if the section contains more than one field.
- For sections with optional or rarely used settings, it's best to keep them collapsed by default.
- Use the `ConfigSubSection` component for organizing subsections within a section. Avoid separating subsections with horizontal lines.

**Example of sections:**

![Sections](/img/data-source-config/config-sections.png)

## Authentication component

Use the `Authentication` component for handling authentication on the configuration page. This component is already wrapped inside a `ConfigSection`, so additional wrapping is unnecessary.

If your data source uses the deprecated `DataSourceHttpSettings` component for authentication, replace it with the `Authentication` component. For guidance on migrating from `DataSourceHttpSettings`, see the section below.

**Example of authentication component:**

![Authentication](/img/data-source-config/config-authentication.png)

## DataSourceHttpSettings migration

The `DataSourceHttpSettings` component is deprecated, and you should migrate to newer components. We’ve introduced three components to streamline this process:

- **Connection section**
- **Authentication** (refer to [Authentication section](#authentication-component))
- **Advanced settings subsection**

To migrate from `DataSourceHttpSettings` to the new 'Auth' component, refer to our [documentation](https://github.com/grafana/plugin-ui/blob/main/src/components/ConfigEditor/Auth/README.md).

### Edge case handling

If your authentication method doesn't require fields, include text explaining this. Add descriptions or external links as needed.

**Example of edge case:**

![Edge cases](/img/data-source-config/config-authentication-component.png)

### Additional settings

Additional settings are optional and provide users with extra control over the data source plugin. These settings should:

- Be placed in a separate section using the `ConfigSection` component.
- Be collapsed by default unless an option within the section is enabled.
- Use the `ConfigSubSection` component, even if there's only one setting. If multiple settings exist that can't be combined, split them across subsections.

**Examples of additional settings:**

![Additional settings](/img/data-source-config/config-additional-settings.png)

![Proxy settings](/img/data-source-config/config-additional-settings-proxy.png)

### Tooltips

Every field should have a tooltip explaining its purpose and where users can find the necessary information. If the field’s format isn’t obvious (for example, a URL), then provide an example.

If users need to perform an action to obtain the field value (for example, generate an API token), then include a link to the relevant documentation.

**Example of tooltip:**

![Tooltip](/img/data-source-config/config-tooltips.png)

When adding a link to a tooltip, make sure it is interactive, meaning it remains visible on hover. Set the `interactive` prop to `true` to achieve this.

### UX writing guidelines for tooltips

Familiarize yourself with our [style guidelines for user interfaces](https://grafana.com/docs/writers-toolkit/write/style-guide/ui-elements/). Above all else:

- Keep tooltips concise and helpful.
- Provide clear, actionable guidance.

## Error handling and messages

Provide users with clear, actionable error messages. Here are the recommended practices:

- Use inline errors when the issue is tied to a specific field (for example, missing or invalid field data).
- Display global error messages for broader issues like timeouts or server errors.

Always include both a human-readable error message and the raw error message. This helps users who may want to search for solutions.

**Example of error handling:**

![Error handling](/img/data-source-config/config-error-handling.png)

For additional guidance on error handling, refer to the `errutil` package in Grafana core.

### UX writing guidelines for errors

- Clearly explain what went wrong.
- Guide the user on how to resolve the issue.

## Config page width

To ensure consistent rendering, set the maximum width for the configuration page to 578px. This prevents layout issues such as overly wide fields. Note that the `Authentication` component already adheres to this width constraint.

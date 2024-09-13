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

Grafana users expect a consistent experience when configuring and using data source plugins. This guide contains best practices and standards that we recommend to provide a consistent, user-friendly experience.

## Logos

If applicable, obtain permissions from the trademark holder of the logo.

- The logo should match the relevant brand guidelines. These logos can usually be found in a company’s brand guidelines section (also called media kit, press kit, etc.)
- Logos should have a transparent background (not white).
- Image format should be SVG.

Example: MongoDB

Example: Datadog

## Description and required fields

We recommend using the `DataSourceDescription` field from the [@grafana/experimental](https://github.com/grafana/grafana-experimental) repository. The data source plugin name and documentation link are required; however, showing information about the required fields is optional.

When using required fields, ideally you shouldn’t type `*` yourself but instead pass a `required` prop to the `InlineField` component. The `required` prop renders `*` at the end of the label automatically.

DataSourceDescription component:

![Description](/img/data-source-config/config-data-source-description.png)

Required field:

![Connection](/img/data-source-config/config-connection.png)

## Sections

The data source plugin configuration page should consist of multiple sections separated by horizontal rules. You can use the `ConfigSection` component for this purpose.

The `section` description property is optional, but you should include it unless there is only one field in the section.

If the `section` only has optional or infrequently used settings, we recommend that it remains collapsed.

You can also use the `ConfigSubSection` component to organize subsections within one section when necessary. Subsections should not be separated by horizontal lines.

![Sections](/img/data-source-config/config-sections.png)

## Authentication component

An `Authentication` component (see README) should be used for the authentication section of the configuration page.

![Authentication](/img/data-source-config/config-authentication.png)

The `Authentication` component is already wrapped into a `ConfigSection` component, so there is no need to wrap it again.

If your data source is using `DataSourceHttpSettings` components for authentication, it should be replaced with the `Authentication` component. As the new authentication component only takes care of the authentication section of the old component, there are other components available that can help you to migrate away from the `DataSourceHttpSettings` component. For more information, refer to the `DataSourceHttpSettings` section of this guide.

## DataSourceHttpSettings

The DataSourceHttpSettings component is deprecated, and you should migrate your data source plugin away from this component.

We have created three components to simplify the migration process:

- Connection section
- Authentication (explained in the authentication section)
- Advanced settings subsection

For a detailed migration guide, refer to this page.

### Edge cases

Case #1: If the authentication method has no fields. Add copy to indicate there are no additional fields, and any additional copy for a description / linkouts.

See screenshot:

![Edge cases](/img/data-source-config/config-authentication-component.png)

### Additional settings

Additional settings are optional settings that can give the user more control over the data source plugin but are not mandatory to connect to the data source plugin.

Additional settings should be placed under a separate section using the `ConfigSection` component. Additionally, they should be collapsed on page load when no option from additional settings is used. When a user enables something from the additional settings section, they can be expanded on page load.

You should use the `ConfigSubSection` component inside the Additional settings section. This should be used even if there is just one setting, or to split out multiple settings that cannot be combined.

![Additional settings](/img/data-source-config/config-additional-settings.png)

![Additional settings](/img/data-source-config/config-additional-settings-proxy.png)

### Tooltips

All fields should have a tooltip that describes what the field is and where someone can find that information. You can also provide an example if it’s not obvious what the format of that field should be (for example, URLs).

If a customer needs to perform some actions to get the field value (for example, generate API token), then add a link to the documentation to indicate where this value can be obtained.

![Tooltip](/img/data-source-config/config-tooltips.png)

When you add a link to a tooltip, make sure that the tooltip is also interactive (that is, that it doesn’t disappear on hover). To do this, pass the `interactive` prop as `true`.

## UX writing guidelines (Tooltips)

## Error handling and error messages

Tell users what happened and how they can fix the problem.

Inline errors should be used as much as possible if the error can be traced back to a field. For example, if the field is not filled in, or if we can validate that a connection string is valid, etc.

Global error messages should be displayed if the error cannot be traced back to a specific field. For example, timeouts, generic server errors, etc.

You should always add raw error messages to global error messages in addition to the human-readable error. By doing so, you can help users who want to search for solutions online.

![Error handling](/img/data-source-config/config-error-handling.png)

Additional information:

The `errutil` package in Grafana core contains a set of common errors

Error Message Writing Guidelines
UX writing guidelines (Errors)

## Config page width

We recommend setting the maximum width for the configuration page content at 578px to avoid issues with page rendering (such as fields rendering too wide or at the edge of the screen). Also, note that the Auth component already uses max width of 578px.

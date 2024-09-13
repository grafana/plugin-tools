---
id: data-source-configuration
title: Configure data sources
description: A guide to data source configuration.
keywords:
  - grafana
  - data source
  - datasource
  - data source configuration
---

# Data source configuration redesign best practices
Users expect a consistent experience when configuring and using data sources. This documentation contains best practices and standards to provide a consistent, easy to use experience.

## Logo
If applicable, obtain permissions from the trademark holder of the logo. .
The logo should match brand guidelines. These logos can usually be found in a company’s brand guidelines section (also called media kit, press kit, etc.)
Ex: MongoDB
Ex: Datadog
Logos should have a transparent background (not white), and be a svg 

## Description and required fields

DataSourceDescription from @grafana/experimental repository should be used. Data source name and documentation link are required, showing info about required fields  is optional.

When using required fields, ideally you shouldn’t type * yourself but instead pass a `required` prop to the InlineField component, it renders * at the end of the label automatically.
DataSourceDescription component:
[screenshot:DS description ]


Required field:
[screenshot: Connection]

## Sections

The data source configuration page should consist of multiple sections separated by horizontal rules, use the ConfigSection component for that.

The section description property is optional, but it should only be omitted if there is only one field in the section.

If the section only has optional / infrequently used settings, it is recommended that it remains collapsed.

You can also use the ConfigSubSection component to organize sub sections within one section when necessary. Sub sections should not be separated by horizontal lines.
[screenshot: Connection/Authentication]


## Authentication component

Authentication component (see README) should be used for the authentication section of the config page.

[screenshot: Authentication ]



The Authentication component is already wrapped into a ConfigSection component, so there is no need to wrap it again.

If your datasource is using DataSourceHttpSettings components for authentication, it should be replaced with the Authentication component.  As the new Auth component only takes care of the authentication section of the old component, there are other components available that can help you to migrate away from the DataSourceHttpSettings component. For more information check the DataSourceHttpSettings section of this document.

## DataSourceHttpSettings

The DataSourceHttpSettings component is deprecated, and you should migrate your data source away from the component.

We have created 3 components to simplify the migration process:
Connection section
Authentication (explained in the authentication section)
Advanced settings subsection

For a detailed migration guide check this page.

### Edge cases

Case #1: If the authentication method has no fields. Add copy to indicate there are no additional fields, and any additional copy for a description / linkouts. See screenshot:

[screenshot: Authentication/oracle/edge]


### Additional settings

Additional settings are optional settings that can give the user more control over the data source but are not mandatory to connect to the data source.

Additional settings should be placed under a separate section (using the ConfigSection component) and be collapsed on page load when no option from additional settings is used. When a user enables something from the additional settings section, they can be expanded on page load.

You should use the ConfigSubSection component inside the Additional settings section. This should be used even if there is just one setting / field, or to split out multiple settings that cannot be combined. 

[screenshot: Additional settings]




[screenshot: Additional settings/Secure Socks]

### Tooltips

All fields should have a tooltip that describes what the field is and where someone can find that information. An example can also be provided if it’s not obvious what the format of that field should be (e.g. URLs).

If a customer needs to perform some actions to get the field value (e.g. generate API token), add a link to the docs or place where this value can be obtained.

[screenshot: The API token…]


When adding a link to the tooltip, make sure that tooltip is also interactive (doesn’t disappear on hover) by passing the `interactive` prop as `true

## UX writing guidelines (Tooltips)

## Error handling and error messages

Tell users what happened and how they can fix the problem.

Inline errors should be used as much as possible if the error can be traced back to a field (e.g. field is not filled in, we can validate if a connection string is invalid, etc.)

Global error messages should be displayed if the error cannot be traced back to a specific field (e.g. timeouts, generic server errors etc.)

Raw error messages should always be added to global error messages in addition to the human readable error, in case users want to search for solutions online.

[screenshot: Connection/AuthenticationAdditional settings ]



Additional information:
The errutil package in Grafana core contains  a set of common errors
Error Message Writing Guidelines
UX writing guidelines (Errors)

## Config page width

We recommend setting the maximum width for the config page content at 578px to avoid rendering section collapse/expand buttons at the edge of the screen and to avoid rendering too wide fields, descriptions, etc.. Also, the Auth component already uses max width 578px.

## Additional information

Example data sources that already made config page overhauls:
Jira
Oracle (soon)
Datadog (soon)
UX writing guidelines

---
id: degregate-ui
title: Protect your UI when working with extension points
sidebar_label: Protect your UI
description: Protect your UI when working with extension points.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
  - degregate
sidebar_position: 90
---

When developing features using UI extensions in Grafana, consider scenarios where rendered content may or may not be available. This allows you to build a resilient UI that remains functional regardless of the availability or number of extensions, and ensures a seamless user experience.  

## Content is not available to be rendered in my extension point

If you've created an extension point but you're not rendering any content yet, make sure that:

- The UI doesn't display this section if it doesn’t make sense without rendered content.
- You provide a fallback UI or placeholder message if the feature is still useful without the rendered content.

For example:

```
{extensions.length > 0 ? (
  extensions.map((Ext, index) => <Ext key={index} />)
) : (
  <DefaultComponent />
)}
```

## My extension point supports multiple elements

You can create an extension point that allows multiple plugins to contribute elements. If this is the case, ensure that the UI:

- Can render multiple extensions without breaking the layout.
- Uses appropriate spacing and ordering.
- Handles conflicts such as conflicting styles or duplicate content.

For example, you can use a container with controlled layout:

```
<div className="extensions-container">
  {extensions.map((Ext, index) => (
    <div key={index} className="extension-item">
      <Ext />
    </div>
  ))}
</div>
```

## My extension point uses external plugins

If you're using external plugins to extend your UI, consider the following:

- Security and validation: Ensure extensions do not introduce vulnerabilities, for example by sanitizing user-generated content.
- Shared data restriction: Only share the minimum amount of data required with external elements. You can always extend later, which is easier than removing.
- Restrict plugins: You can decide to only allow certain plugins to provide content for your extension point.

For example, you can restrict extensions by plugin ID:

```
const allowedExtensions = extensions.filter(ext => allowedPluginIds.includes(ext.pluginId));
```




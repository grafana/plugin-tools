---
id: subscribe-events
title: Subscribe to Grafana events
description: Work with the event bus to subscribe to Grafana application events
keywords:
  - grafana
  - plugins
  - plugin
  - panel
  - properties
  - eventbus
  - event bus
  - subscribe
  - events
---

# Subscribe to Grafana events

If you’re building a [panel plugin](../../key-concepts/plugin-types-usage.md#panel-visualization-plugins), in some cases you may want your plugin to react to changes that occur outside of your plugin. For example, you may want your plugin to react when the user zooms in or out of another panel. In this guide, you’ll learn how to make your plugin react to events in Grafana.

:::tip

For a step-by-step guide to making your own panel plugin, refer to our [Tutorial for panel plugins](../../tutorials/build-a-panel-plugin.md).

:::

## Access the event bus

The event bus for subscribing to Grafana events is located in the [`PanelProps`](https://github.com/grafana/grafana/blob/57960148e47e4d82e899dbfa3cb9b2d474ad56dc/packages/grafana-data/src/types/panel.ts#L74-L122) interface. This interface exposes runtime information about the panel, such as the panel's dimensions and timing measurements. Refer to the code comments for the property definitions.

You can access the event bus and other panel properties through the `props` argument of your plugin. For example:

```tsx title="src/components/SimplePanel.tsx"
export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
```

## Subscribe to Grafana application events

Grafana uses an event bus to publish application events to notify different parts of Grafana when the user performs an action. Your plugin can react to these actions by subscribing to one or more events.

Events are identified by a unique string; also, they can have an optional payload. In the following example, the `ZoomOutEvent` is identified by the `zoom-out` string and carries a number as a payload.

```tsx
class ZoomOutEvent extends BusEventWithPayload<number> {
  static type = 'zoom-out';
}
```

Here are a few other events you can subscribe to:

- `RefreshEvent` from `@grafana/runtime`
- `DataHoverEvent` from `@grafana/data`

You can access the event bus available from the panel props, and subscribe to events of a certain type using the `getStream()` method. The callback passed to the subscribe method will be called for every new event, as in this example:

```tsx
import React, { useEffect } from 'react';
import { RefreshEvent } from '@grafana/runtime';

// ...

interface Props extends PanelProps<MyOptions> {}

export const MyPanel: React.FC<Props> = ({ eventBus }) => {
  useEffect(() => {
    const subscriber = eventBus.getStream(RefreshEvent).subscribe((event) => {
      console.log(`Received event: ${event.type}`);
    });

    return () => {
      subscriber.unsubscribe();
    };
  }, [eventBus]);

  return <div>Event bus example</div>;
};
```

:::important

Remember to call `unsubscribe()` on your subscriber to avoid memory leaks.

:::

## What events are supported?

While there’s no official documentation of the supported events at this time, you may be able to extract events based on their usage in other plugins and the functionality they offer.

Note that while many event types are available but not yet exported, such as the `PanelEditEnteredEvent`, you can still subscribe to them by re-implementing the event type yourself:

```tsx
class MyPanelEditEnteredEvent extends BusEventWithPayload<number> {
  static type = 'panel-edit-started';
}
```

We’ll be improving the event bus and adding more events in the future. Let us know how you’re using the event bus in [our Community forum](https://community.grafana.com/c/plugin-development/30), and any events you think would be useful to your plugin!

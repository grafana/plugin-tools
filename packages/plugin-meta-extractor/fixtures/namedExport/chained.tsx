import React from 'react';
import { AppPlugin, PluginExtensionPoints } from '@grafana/data';

export const plugin = new AppPlugin()
  .configureExtensionComponent({
    extensionPointId: PluginExtensionPoints.CommandPalette,
    title: 'Component title 1',
    description: 'Component description 1',
    component: () => <div />,
  })
  .configureExtensionLink({
    extensionPointId: PluginExtensionPoints.DashboardPanelMenu,
    title: 'Link title 1',
    description: 'Link description 1',
    onClick: () => {},
  })
  .configureExtensionComponent({
    extensionPointId: 'grafana/dashboard/panel/menu',
    title: 'Component title 2',
    description: 'Component description 2',
    component: () => <div />,
  })
  .configureExtensionLink({
    extensionPointId: 'grafana/commandpalette/action',
    title: 'Link title 2',
    description: 'Link description 2',
    onClick: () => {},
  });

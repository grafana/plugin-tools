import React from 'react';
import { AppPlugin, PluginExtensionPoints } from '@grafana/data';
import { registerExtensions } from '../utils';

export default registerExtensions(
  new AppPlugin()
    .configureExtensionComponent({
      extensionPointId: PluginExtensionPoints.CommandPalette,
      title: 'Component title 0',
      description: 'Component description 0',
      component: () => <div />,
    })
    .configureExtensionLink({
      extensionPointId: PluginExtensionPoints.DashboardPanelMenu,
      title: 'Link title 0',
      description: 'Link description 0',
      onClick: () => {},
    })
);

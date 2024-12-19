import React, { useMemo } from 'react';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { URLS } from '../../constants';
import { getBasicScene } from '../Home/scenes';

const getTab1Scene = () => {
  return getBasicScene(false, '__server_names');
};

const getTab2Scene = () => {
  return getBasicScene(false, '__house_locations');
};

const getScene = () =>
  new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Page with tabs',
        subTitle: 'This scene showcases a basic tabs functionality.',
        // Important: Mind the page route is ambiguous for the tabs to work properly
        url: URLS.WithTabs,
        routePath: '*',
        hideFromBreadcrumbs: true,
        getScene: getTab1Scene,
        tabs: [
          new SceneAppPage({
            title: 'Server names',
            url: URLS.WithTabs,
            routePath: '/',
            getScene: getTab1Scene,
          }),
          new SceneAppPage({
            title: 'House locations',
            url: `${URLS.WithTabs}/tab-two`,
            routePath: 'tab-two/*',
            getScene: getTab2Scene,
          }),
        ],
      }),
    ],
  });

const PageWithTabs = () => {
  const scene = useMemo(() => getScene(), []);

  return <scene.Component model={scene} />;
};

export default PageWithTabs;

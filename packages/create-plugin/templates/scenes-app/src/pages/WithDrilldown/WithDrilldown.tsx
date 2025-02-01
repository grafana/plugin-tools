import React, { useMemo } from 'react';
import { DATASOURCE_REF, URLS } from '../../constants';
import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimePicker,
  SceneTimeRange,
} from '@grafana/scenes';
import { getHumidityOverviewScene, getTemperatureOverviewScene } from './scenes';
import { getRoomsTemperatureStats, getRoomsTemperatureTable } from './panels';

const roomsTemperatureQuery = {
  refId: 'Rooms temperature',
  datasource: DATASOURCE_REF,
  scenarioId: 'random_walk',
  seriesCount: 8,
  alias: '__house_locations',
  min: 10,
  max: 27,
};

const getScene = () =>
  new EmbeddedScene({
    $data: new SceneQueryRunner({
      datasource: DATASOURCE_REF,
      queries: [roomsTemperatureQuery],
      maxDataPoints: 100,
    }),

    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: 300,
          body: getRoomsTemperatureTable(),
        }),
        new SceneFlexItem({
          ySizing: 'fill',
          body: getRoomsTemperatureStats(),
        }),
      ],
    }),
  });

const getDrilldownsAppScene = () => {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now' }),
        title: 'Page with drilldown',
        subTitle: 'This scene showcases a basic drilldown functionality. Interact with room to see room details scene.',
        controls: [new SceneTimePicker({ isOnCanvas: true })],
        url: URLS.WithDrilldown,
        routePath: '*',
        hideFromBreadcrumbs: true,
        getScene,
        drilldowns: [
          {
            routePath: 'room/:roomName/*',
            getPage(routeMatch, parent) {
              const roomName = routeMatch.params.roomName;

              return new SceneAppPage({
                url: `${URLS.WithDrilldown}/room/${roomName}/temperature`,
                routePath: `room/:roomName/*`,
                title: `${roomName} overview`,
                subTitle: 'This scene is a particular room drilldown. It implements two tabs to organise the data.',
                getParentPage: () => parent,
                getScene: () => {
                  return new EmbeddedScene({ body: new SceneFlexLayout({ children: [] }) });
                },
                tabs: [
                  new SceneAppPage({
                    title: 'Temperature',
                    url: `${URLS.WithDrilldown}/room/${roomName}/temperature`,
                    routePath: `temperature`,
                    getScene: () => getTemperatureOverviewScene(roomName),
                  }),
                  new SceneAppPage({
                    title: 'Humidity',
                    url: `${URLS.WithDrilldown}/room/${roomName}/humidity`,
                    routePath: `humidity`,
                    getScene: () => getHumidityOverviewScene(roomName),
                  }),
                ],
              });
            },
          },
        ],
      }),
    ],
  });
};

const WithDrilldown = () => {
  const scene = useMemo(() => getDrilldownsAppScene(), []);

  return <scene.Component model={scene} />;
};

export default WithDrilldown;

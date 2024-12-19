import React from 'react';
import { Route, Routes as RoutesOriginal } from 'react-router-dom';
import { ROUTES } from '../../constants';
const HomePage = React.lazy(() => import('../../pages/Home/Home'));
const PageWithTabs = React.lazy(() => import('../../pages/WithTabs/WithTabs'));
const WithDrilldown = React.lazy(() => import('../../pages/WithDrilldown/WithDrilldown'));
const HelloWorld = React.lazy(() => import('../../pages/HelloWorld/HelloWorld'));

export const Routes = () => {
  return (
    <RoutesOriginal>
      <Route path={ROUTES.WithTabs} element={<PageWithTabs />} />
      <Route path={ROUTES.WithDrilldown} element={<WithDrilldown />} />
      <Route path={ROUTES.Home} element={<HomePage />} />
      <Route path={ROUTES.HelloWorld} element={<HelloWorld />} />
      <Route path="/" element={<HomePage />} />
    </RoutesOriginal>
  );
};

import React from 'react';
import { Route, Routes as ReactRoutes } from 'react-router-dom';
import { HomePage } from '../../pages/Home';
import { PageWithTabs } from '../../pages/WithTabs';
import { WithDrilldown } from '../../pages/WithDrilldown';
import { ROUTES } from '../../constants';
import { HelloWorldPluginPage } from '../../pages/HelloWorld';
 
export const Routes = () => {
  return (
    // HEADS UP! We don't need a <BrowserRouter> here, as the core Grafana app already has a router.
    <ReactRoutes>
      {/* HEADS UP! We can use relative paths here now. */}
      <Route path={ROUTES.WithTabs} element={<PageWithTabs />} />
      <Route path={ROUTES.WithDrilldown} element={<WithDrilldown />} />
      <Route path={ROUTES.Home} element={<HomePage />} />
      <Route path={ROUTES.HelloWorld} element={<HelloWorldPluginPage />} />

      <Route path="*" element={<HomePage />} />
    </ReactRoutes>
  );
};

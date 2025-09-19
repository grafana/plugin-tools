import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { PluginIncludeRelativePaths } from 'codegen/includes';
const PageOne = React.lazy(() => import('../../pages/PageOne'));
const PageTwo = React.lazy(() => import('../../pages/PageTwo'));
const PageThree = React.lazy(() => import('../../pages/PageThree'));
const PageFour = React.lazy(() => import('../../pages/PageFour'));

function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path={PluginIncludeRelativePaths.PageTwo} element={<PageTwo />} />
      <Route path={`${PluginIncludeRelativePaths.PageThree}/:id?`} element={<PageThree />} />

      {/* Full-width page (this page will have no side navigation) */}
      <Route path={PluginIncludeRelativePaths.PageFour} element={<PageFour />} />

      {/* Default page */}
      <Route path="*" element={<PageOne />} />
    </Routes>
  );
}

export default App;

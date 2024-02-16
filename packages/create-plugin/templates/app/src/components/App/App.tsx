import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
import { PageFour, PageOne, PageThree, PageTwo } from '../../pages';

export function App(props: AppRootProps) {
  return (
      <Routes>
        <Route path={ROUTES.Two} element={<PageTwo />} />
        <Route path={`${ROUTES.Three}/:id?`} element={<PageThree />} />

        {/* Full-width page (this page will have no side navigation) */}
        <Route path={ROUTES.Four} element={<PageFour />} />

        {/* Default page */}
        <Route path="*" element={<PageOne />} />
      </Routes>
  );
}

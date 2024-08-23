import React from 'react';
import { AppRootProps } from '@grafana/data';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { Routes } from '../Routes/Routes';

export function App(props: AppRootProps) {
  return (
    <PluginPropsContext.Provider value={props}>
      <Routes />
    </PluginPropsContext.Provider>
  );
}

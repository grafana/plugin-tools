import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppConfig, AppConfigProps } from './AppConfig';

describe('Components/AppConfig', () => {
  let props: AppConfigProps;

  beforeEach(() => {
    jest.resetAllMocks();

    props = {
      plugin: {
        meta: {
          id: 'sample-app',
          name: 'Sample App',
          type: 'app',
          enabled: true,
          jsonData: {},
        },
      },
      query: {},
    };
  });

  test('renders without an error"', () => {
    render(<AppConfig plugin={props.plugin} query={props.query} />);

    expect(screen.queryByText(/Enable \/ Disable/i)).toBeInTheDocument();
  });

  test('renders an "Enable" button if the plugin is disabled', () => {
    const plugin = { meta: { ...props.plugin.meta, enabled: false } };

    render(<AppConfig plugin={plugin} query={props.query} />);

    expect(screen.queryByText(/The plugin is currently not enabled./i)).toBeInTheDocument();
    expect(screen.queryByText(/The plugin is currently enabled./i)).not.toBeInTheDocument();
  });

  test('renders a "Disable" button if the plugin is enabled', () => {
    const plugin = { meta: { ...props.plugin.meta, enabled: true } };

    render(<AppConfig plugin={plugin} query={props.query} />);

    expect(screen.queryByText(/The plugin is currently enabled./i)).toBeInTheDocument();
    expect(screen.queryByText(/The plugin is currently not enabled./i)).not.toBeInTheDocument();
  });
});

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
});

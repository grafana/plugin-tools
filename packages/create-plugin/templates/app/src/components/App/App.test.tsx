import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, waitFor } from '@testing-library/react';
import App from './App';
import { testIds } from '../testIds';

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    jest.resetAllMocks();

    props = {
      basename: 'a/sample-app',
      meta: {
        id: 'sample-app',
        name: 'Sample App',
        type: PluginType.app,
        enabled: true,
        jsonData: {},
      },
      query: {},
      path: '',
      onNavChanged: jest.fn(),
    } as unknown as AppRootProps;
  });

  test('renders without an error"', async () => {
    const { queryByTestId, findByText } = render(
      <BrowserRouter>
        <App {...props} />
      </BrowserRouter>
    );

    await waitFor(() => expect(queryByTestId(testIds.pageOne.container)).toBeInTheDocument(), { timeout: 10000 });
    expect(await findByText(/this is page one./i)).toBeInTheDocument();
  });
});

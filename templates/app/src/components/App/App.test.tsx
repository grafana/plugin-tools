import React from 'react';
import { render, screen } from '@testing-library/react';
import { App } from './App';

const meta = {
  id: 'sample-app',
  name: 'Sample App',
  type: 'app',
};

const query = {};

describe('Components/App', () => {
  let basename, meta, path, query, onNavChanged;

  beforeEach(() => {
    jest.resetAllMocks();

    basename = 'a/sample-app';
    meta = {
      id: 'sample-app',
      name: 'Sample App',
      type: 'app',
      enabled: true,
      jsonData: {},
    };
    query = {};
    path = '';
    onNavChanged = jest.fn();
  });

  test('renders without an error"', () => {
    render(<App basename={basename} meta={meta} path={path} query={query} onNavChanged={onNavChanged} />);

    expect(screen.queryByText(/Hello Grafana!/i)).toBeInTheDocument();
  });
});

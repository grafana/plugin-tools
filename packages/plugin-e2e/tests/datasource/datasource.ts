import { DataSource } from '../../src/types';

export const sheetsDataSource: DataSource = {
  type: 'grafana-googlesheets-datasource',
  name: 'GoogleSheets_E2E',
  uid: 'P7DC3E4760CFAC4AHHGGAA',
  access: 'proxy',
  editable: true,
  isDefault: false,
  jsonData: {
    authType: 'jwt',
  },
  secureJsonData: {
    jwt: process.env.GOOGLE_JWT_FILE ?? ''.replace(/\\n/g, '\n'),
  },
};

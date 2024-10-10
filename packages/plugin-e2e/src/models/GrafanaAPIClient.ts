import { APIRequestContext } from '@playwright/test';
import { CreateDataSourceArgs, DataSourceSettings, User } from '../types';

export class GrafanaAPIClient {
  constructor(private request: APIRequestContext) {}

  async getUserIdByUsername(userName: string) {
    const getUserIdByUserNameReq = await this.request.get(`/api/users/lookup?loginOrEmail=${userName}`);
    const json = await getUserIdByUserNameReq.json();
    return json.id;
  }

  async createUser(user: User) {
    const createUserReq = await this.request.post(`/api/admin/users`, {
      data: {
        name: user?.user,
        login: user?.user,
        password: user?.password,
      },
    });
    let userId: number | undefined;
    if (createUserReq.ok()) {
      const respJson = await createUserReq.json();
      userId = respJson.id;
    } else if (createUserReq.status() === 412) {
      // user already exists
      userId = await this.getUserIdByUsername(user?.user);
    } else {
      throw new Error(
        `Could not create user '${
          user?.user
        }'. Find information on how user can be managed in the plugin-e2e docs: https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/use-authentication#managing-users  : ${await createUserReq.text()}`
      );
    }

    if (user.role) {
      const updateRoleReq = await this.request.patch(`/api/org/users/${userId}`, {
        data: { role: user.role },
      });
      if (!updateRoleReq.ok()) {
        throw new Error(`Could not assign role '${user.role}' to user '${user.user}': ${await updateRoleReq.text()}`);
      }
    }
  }

  async getDataSourceSettingsByUID(uid: string) {
    const response = await this.request.get(`/api/datasources/uid/${uid}`);
    if (!response.ok()) {
      throw new Error(
        `Failed to get datasource by uid: ${response.statusText()}. If you're using a provisioned data source, make sure it has a UID`
      );
    }
    const settings: DataSourceSettings = await response.json();
    return settings;
  }

  async createDataSource(datasource: CreateDataSourceArgs, dsName: string) {
    return this.request.post('/api/datasources', {
      data: {
        ...datasource,
        name: dsName,
        access: 'proxy',
        isDefault: false,
      },
    });
  }

  async getDataSourceByName(name: string) {
    return this.request.get(`/api/datasources/name/${name}`);
  }

  async deleteDataSourceByUID(uid: string) {
    return this.request.delete(`/api/datasources/uid/${uid}`);
  }
}

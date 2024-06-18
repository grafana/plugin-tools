import { APIRequestContext, expect } from '@playwright/test';
import { DataSourceSettings, User } from '../types';

export class GrafanaAPIClient {
  constructor(private request: APIRequestContext) {}

  async getUserIdByUsername(userName: string) {
    const getUserIdByUserNameReq = await this.request.get(`/api/users/lookup?loginOrEmail=${userName}`);
    await expect(getUserIdByUserNameReq.ok()).toBeTruthy();
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
      throw new Error(`Could not create user '${user?.user}': ${await createUserReq.text()}`);
    }

    if (user.role) {
      const updateRoleReq = await this.request.patch(`/api/org/users/${userId}`, {
        data: { role: user.role },
      });
      const updateRoleReqText = await updateRoleReq.text();
      console.log(updateRoleReqText);
      await expect(
        updateRoleReq.ok(),
        `Could not assign role '${user.role}' to user '${user.user}': ${updateRoleReqText}`
      ).toBeTruthy();
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
}

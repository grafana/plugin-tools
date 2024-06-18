import { APIRequestContext, expect } from '@playwright/test';
import { User } from '../types';

export class GrafanaAPIClient {
  constructor(private request: APIRequestContext, private storageState: string) {}

  async init() {
    // const loginReq = await this.request.post('/login', { data: this.grafanaAPICredentials });
    // const text = await loginReq.text();
    // expect.soft(loginReq.ok(), `Could not log in to Grafana: ${text}`).toBeTruthy();
    // await this.request.storageState({ path: path.join(process.cwd(), `playwright/.auth/grafanaAPICredentials.json`) });
    await this.request.storageState({ path: this.storageState });
  }

  async getUserIdByUsername(userName: string) {
    try {
      const getUserIdByUserNameReq = await this.request.get(`/api/users/lookup?loginOrEmail=${userName}`);
      await expect(getUserIdByUserNameReq.ok()).toBeTruthy();
      const json = await getUserIdByUserNameReq.json();
      return json.id;
    } catch (error) {
      console.log(error);
    }
  }

  async createUser(user: User) {
    const createUserReq = await this.request.post(`/api/admin/users`, {
      data: {
        name: user?.user,
        login: user?.user,
        password: user?.password,
      },
      // headers: getHeaders(grafanaAPICredentials),
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
}

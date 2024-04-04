import { APIRequestContext, expect, TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../../types';

type CreateUserFixture = TestFixture<() => Promise<void>, PlaywrightArgs>;

const headers = {
  Authorization: `Basic ${Buffer.from(`admin:admin`).toString('base64')}`,
};

const getUserIdByUsername = async (request: APIRequestContext, userName: string): Promise<number> => {
  const getUserIdByUserNameReq = await request.get(`/api/users/lookup?loginOrEmail=${userName}`, {
    headers,
  });
  expect(getUserIdByUserNameReq.ok()).toBeTruthy();
  const json = await getUserIdByUserNameReq.json();
  return json.id;
};

export const createUser: CreateUserFixture = async ({ request, user }, use) => {
  await use(async () => {
    if (!user) {
      throw new Error('Playwright option `User` was not provided');
    }

    const createUserReq = await request.post(`/api/admin/users`, {
      data: {
        name: user?.user,
        login: user?.user,
        password: user?.password,
      },
      headers,
    });

    let userId: number | undefined;
    if (createUserReq.ok()) {
      const respJson = await createUserReq.json();
      userId = respJson.id;
    } else if (createUserReq.status() === 412) {
      // user already exists
      userId = await getUserIdByUsername(request, user?.user);
    } else {
      throw new Error(`Could not create user '${user?.user}': ${await createUserReq.text()}`);
    }

    if (user.role) {
      const updateRoleReq = await request.patch(`/api/org/users/${userId}`, {
        data: { role: user.role },
        headers,
      });
      const updateRoleReqText = await updateRoleReq.text();
      expect(
        updateRoleReq.ok(),
        `Could not assign role '${user.role}' to user '${user.user}': ${updateRoleReqText}`
      ).toBeTruthy();
    }
  });
};

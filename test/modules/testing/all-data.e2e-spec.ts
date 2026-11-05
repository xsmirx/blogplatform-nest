import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { PATHS } from '../../setup/constants.js';
import { UsersTestManager } from '../../helpers/users.test-manager.js';
import {
  makeUserDto,
  type Paginator,
  type UserViewModel,
} from '../../helpers/data.js';

describe('DELETE /testing/all-data — служебная очистка базы', () => {
  let ctx: TestAppContext;
  let users: UsersTestManager;

  beforeAll(async () => {
    ctx = await initApp();
    users = new UsersTestManager(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  it('возвращает 204 и пустое тело', async () => {
    const response = await ctx.http().delete(PATHS.testingAllData).expect(204);

    expect(response.body).toEqual({});
  });

  it('не требует авторизации', async () => {
    await ctx.http().delete(PATHS.testingAllData).expect(204);
  });

  it('идемпотентна: повторный вызов на пустой базе тоже 204', async () => {
    await ctx.http().delete(PATHS.testingAllData).expect(204);
    await ctx.http().delete(PATHS.testingAllData).expect(204);
  });

  it('действительно удаляет данные', async () => {
    await ctx.http().delete(PATHS.testingAllData).expect(204);
    await users.createMany(3);

    const before = await users.getAll().expect(200);
    expect((before.body as Paginator<UserViewModel>).totalCount).toBe(3);

    await ctx.http().delete(PATHS.testingAllData).expect(204);

    const after = await users.getAll().expect(200);
    expect((after.body as Paginator<UserViewModel>).totalCount).toBe(0);
  });

  it('после очистки приложение остаётся работоспособным', async () => {
    await ctx.http().delete(PATHS.testingAllData).expect(204);

    await users.create(makeUserDto(1)).expect(201);
  });
});

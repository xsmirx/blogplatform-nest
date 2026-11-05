import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { INVALID_BASIC_AUTH } from '../../setup/constants.js';
import { UsersTestManager } from '../../helpers/users.test-manager.js';
import {
  makeUserDto,
  nonExistingObjectId,
  type Paginator,
  type UserViewModel,
} from '../../helpers/data.js';

describe('DELETE /users/{id} — удаление пользователя (Basic Auth)', () => {
  let ctx: TestAppContext;
  let users: UsersTestManager;

  beforeAll(async () => {
    ctx = await initApp();
    users = new UsersTestManager(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  beforeEach(async () => {
    await clearDb(ctx);
  });

  describe('204 — успешное удаление', () => {
    it('возвращает 204 с пустым телом', async () => {
      const user = await users.createAndGet(makeUserDto(1));

      const response = await users.delete(user.id).expect(204);

      expect(response.body).toEqual({});
    });

    it('удалённый пользователь исчезает из GET /users', async () => {
      const user = await users.createAndGet(makeUserDto(1));
      await users.delete(user.id).expect(204);

      const list = await users.getAll().expect(200);
      const body = list.body as Paginator<UserViewModel>;

      expect(body.totalCount).toBe(0);
      expect(body.items).toEqual([]);
    });

    it('удаляет только указанного пользователя', async () => {
      const { views } = await users.createMany(3);

      await users.delete(views[1]!.id).expect(204);

      const logins = await users.loginsInList();
      expect(logins.sort()).toEqual(['user1', 'user3']);
    });

    it('после удаления login и email снова свободны', async () => {
      const dto = makeUserDto(1);
      const user = await users.createAndGet(dto);
      await users.delete(user.id).expect(204);

      await users.create(dto).expect(201);
    });
  });

  describe('404 — пользователь не найден', () => {
    it('несуществующий, но корректный по формату id', async () => {
      await users.delete(nonExistingObjectId()).expect(404);
    });

    it('повторное удаление того же пользователя', async () => {
      const user = await users.createAndGet(makeUserDto(1));

      await users.delete(user.id).expect(204);
      await users.delete(user.id).expect(404);
    });

    it('id некорректного формата тоже даёт 404, а не 500', async () => {
      // Важный кейс: невалидный ObjectId не должен ронять приложение.
      await users.delete('not-an-object-id').expect(404);
    });
  });

  describe('401 — Basic Auth', () => {
    it('без заголовка Authorization', async () => {
      const user = await users.createAndGet(makeUserDto(1));

      await users.delete(user.id, null).expect(401);
    });

    it('с неверными credentials', async () => {
      const user = await users.createAndGet(makeUserDto(1));

      await users.delete(user.id, INVALID_BASIC_AUTH).expect(401);
    });

    it('401 проверяется раньше, чем существование пользователя', async () => {
      await users.delete(nonExistingObjectId(), null).expect(401);
    });

    it('не удаляет пользователя при 401', async () => {
      const user = await users.createAndGet(makeUserDto(1));
      await users.delete(user.id, null).expect(401);

      const list = await users.getAll().expect(200);
      expect((list.body as Paginator<UserViewModel>).totalCount).toBe(1);
    });
  });
});

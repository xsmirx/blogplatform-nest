import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../setup/init-app.js';
import { AuthTestManager } from '../helpers/auth.test-manager.js';
import { UsersTestManager } from '../helpers/users.test-manager.js';
import {
  makeUserDto,
  type MeViewModel,
  type Paginator,
  type UserViewModel,
} from '../helpers/data.js';
import { expectErrorsForFields } from '../helpers/expected.js';

/**
 * Сценарии на стыке модулей Users (админка, Basic Auth) и Auth.
 *
 * Тесты в test/modules/* проверяют каждый модуль изолированно и
 * ходят только в свои эндпоинты. Здесь — то, что можно проверить
 * только связкой: пользователь создан одним модулем, а наблюдается
 * через другой. Эти тесты имеет смысл запускать, когда оба модуля
 * уже работают по отдельности.
 */
describe('Интеграция Users ↔ Auth', () => {
  let ctx: TestAppContext;
  let auth: AuthTestManager;
  let users: UsersTestManager;

  beforeAll(async () => {
    ctx = await initApp();
    auth = new AuthTestManager(ctx);
    users = new UsersTestManager(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  beforeEach(async () => {
    await clearDb(ctx);
  });

  describe('пользователь, созданный админом (POST /users)', () => {
    it('считается подтверждённым и может сразу залогиниться', async () => {
      const dto = makeUserDto(1);
      await users.createAndGet(dto);

      await auth
        .login({ loginOrEmail: dto.login, password: dto.password })
        .expect(200);
    });

    it('GET /auth/me отдаёт userId, совпадающий с id из POST /users', async () => {
      const dto = makeUserDto(1);
      const created = await users.createAndGet(dto);
      const token = await auth.loginAndGetToken(dto.login, dto.password);

      const response = await auth.me(token).expect(200);

      expect((response.body as MeViewModel).userId).toBe(created.id);
    });

    it('его login нельзя занять через регистрацию', async () => {
      const existing = makeUserDto(1);
      await users.createAndGet(existing);

      const response = await auth
        .registration(makeUserDto(2, { login: existing.login }))
        .expect(400);

      expectErrorsForFields(response.body, ['login']);
    });

    it('его email нельзя занять через регистрацию', async () => {
      const existing = makeUserDto(1);
      await users.createAndGet(existing);

      const response = await auth
        .registration(makeUserDto(2, { email: existing.email }))
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('переотправка письма подтверждения для него — 400 (уже подтверждён)', async () => {
      const dto = makeUserDto(1);
      await users.createAndGet(dto);

      const response = await auth
        .resendRegistrationEmail({ email: dto.email })
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });
  });

  describe('пользователь, зарегистрировавшийся сам (POST /auth/registration)', () => {
    it('виден в GET /users ещё до подтверждения', async () => {
      const dto = makeUserDto(1);

      await auth.registration(dto).expect(204);

      const list = await users.getAll().expect(200);
      const body = list.body as Paginator<UserViewModel>;

      expect(body.totalCount).toBe(1);
      expect(body.items[0]).toMatchObject({
        login: dto.login,
        email: dto.email,
      });
    });

    it('его login нельзя занять через POST /users', async () => {
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);

      const response = await users
        .create(makeUserDto(2, { login: dto.login }))
        .expect(400);

      expectErrorsForFields(response.body, ['login']);
    });
  });

  describe('удаление пользователя админом (DELETE /users/{id})', () => {
    it('удалённый пользователь больше не может залогиниться', async () => {
      const dto = makeUserDto(1);
      const user = await users.createAndGet(dto);

      await auth
        .login({ loginOrEmail: dto.login, password: dto.password })
        .expect(200);

      await users.delete(user.id).expect(204);

      await auth
        .login({ loginOrEmail: dto.login, password: dto.password })
        .expect(401);
    });

    it('ранее выданный accessToken удалённого пользователя не принимается в /auth/me', async () => {
      const dto = makeUserDto(1);
      const user = await users.createAndGet(dto);
      const token = await auth.loginAndGetToken(dto.login, dto.password);

      await users.delete(user.id).expect(204);

      await auth.me(token).expect(401);
    });
  });
});

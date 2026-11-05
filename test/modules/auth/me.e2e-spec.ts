import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { VALID_BASIC_AUTH } from '../../setup/constants.js';
import { AuthTestManager } from '../../helpers/auth.test-manager.js';
import {
  makeUserDto,
  type MeViewModel,
  type UserInputModel,
} from '../../helpers/data.js';
import { expectedMeView } from '../../helpers/expected.js';

describe('GET /auth/me — информация о текущем пользователе (Bearer)', () => {
  let ctx: TestAppContext;
  let auth: AuthTestManager;
  let user: UserInputModel;
  let token: string;

  beforeAll(async () => {
    ctx = await initApp();
    auth = new AuthTestManager(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  beforeEach(async () => {
    await clearDb(ctx);
    user = makeUserDto(1);
    await auth.registerAndConfirm(user);
    token = await auth.loginAndGetToken(user.login, user.password);
  });

  describe('200 — успешный запрос', () => {
    it('возвращает MeViewModel', async () => {
      const response = await auth.me(token).expect(200);

      expect(response.body).toEqual(expectedMeView(user));
    });

    it('не содержит лишних полей (в частности id вместо userId)', async () => {
      const response = await auth.me(token).expect(200);

      expect(Object.keys(response.body as object).sort()).toEqual([
        'email',
        'login',
        'userId',
      ]);
    });

    it('userId одинаковый для разных токенов одного пользователя', async () => {
      const secondToken = await auth.loginAndGetToken(
        user.email,
        user.password,
      );

      const first = await auth.me(token).expect(200);
      const second = await auth.me(secondToken).expect(200);

      expect((first.body as MeViewModel).userId).toBe(
        (second.body as MeViewModel).userId,
      );
    });

    it('токен другого пользователя отдаёт данные именно этого пользователя', async () => {
      const second = makeUserDto(2);
      await auth.registerAndConfirm(second);
      const secondToken = await auth.loginAndGetToken(
        second.login,
        second.password,
      );

      const first = await auth.me(token).expect(200);
      const response = await auth.me(secondToken).expect(200);

      expect(response.body).toEqual(expectedMeView(second));
      expect((response.body as MeViewModel).userId).not.toBe(
        (first.body as MeViewModel).userId,
      );
    });
  });

  describe('401 — проблемы с токеном', () => {
    it('без заголовка Authorization', async () => {
      await auth.me().expect(401);
    });

    it('пустой заголовок Authorization', async () => {
      await auth.meWithRawHeader('').expect(401);
    });

    it('Bearer без токена', async () => {
      await auth.meWithRawHeader('Bearer').expect(401);
    });

    it('схема Basic вместо Bearer', async () => {
      const encoded = Buffer.from(
        `${VALID_BASIC_AUTH.username}:${VALID_BASIC_AUTH.password}`,
      ).toString('base64');

      await auth.meWithRawHeader(`Basic ${encoded}`).expect(401);
    });

    it('токен без схемы', async () => {
      await auth.meWithRawHeader(token).expect(401);
    });

    it('мусор вместо токена', async () => {
      await auth.me('not-a-jwt').expect(401);
    });

    it('токен с испорченной подписью', async () => {
      const tampered = `${token.slice(0, -3)}abc`;

      await auth.me(tampered).expect(401);
    });

    it('токен, подписанный чужим секретом', async () => {
      // Собран вручную с секретом "other-secret".
      const foreignToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJ1c2VySWQiOiI2NTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifQ.' +
        'r8nE0h1y1nZl7Zg0rJ7JcZr8w4aJ3mJ3nqQ1k4qQ9bE';

      await auth.me(foreignToken).expect(401);
    });
  });

  describe('истечение токена', () => {
    it.todo(
      'accessToken протухает через 5 минут — требует vi.useFakeTimers ' +
        'или отдельного приложения с коротким JWT_ACCESS_EXPIRES_IN (например 1s)',
    );
  });
});

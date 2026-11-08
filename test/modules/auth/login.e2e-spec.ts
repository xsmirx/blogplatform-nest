import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { AuthTestManager } from '../../helpers/auth.test-manager.js';
import {
  makeUserDto,
  type LoginSuccessViewModel,
  type UserInputModel,
} from '../../helpers/data.js';
import {
  expectErrorsForFields,
  expectJwtShape,
} from '../../helpers/expected.js';

describe('POST /auth/login — вход в систему', () => {
  let ctx: TestAppContext;
  let auth: AuthTestManager;
  let user: UserInputModel;

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
  });

  describe('200 — успешный вход', () => {
    it('возвращает только accessToken', async () => {
      const response = await auth
        .login({ loginOrEmail: user.login, password: user.password })
        .expect(200);

      expect(Object.keys(response.body as object)).toEqual(['accessToken']);
    });

    it('accessToken похож на JWT', async () => {
      const response = await auth
        .login({ loginOrEmail: user.login, password: user.password })
        .expect(200);

      expectJwtShape((response.body as LoginSuccessViewModel).accessToken);
    });

    it('вход по login', async () => {
      await auth
        .login({ loginOrEmail: user.login, password: user.password })
        .expect(200);
    });

    it('вход по email', async () => {
      await auth
        .login({ loginOrEmail: user.email, password: user.password })
        .expect(200);
    });

    it('полученный токен работает в GET /auth/me', async () => {
      const token = await auth.loginAndGetToken(user.login, user.password);

      await auth.me(token).expect(200);
    });

    it('повторный вход выдаёт рабочий токен', async () => {
      const first = await auth.loginAndGetToken(user.login, user.password);
      const second = await auth.loginAndGetToken(user.login, user.password);

      await auth.me(first).expect(200);
      await auth.me(second).expect(200);
    });

    it('не возвращает refreshToken в теле', async () => {
      const response = await auth
        .login({ loginOrEmail: user.login, password: user.password })
        .expect(200);

      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('неподтверждённый пользователь тоже может залогиниться', async () => {
      // Подтверждение email не является условием входа.
      const unconfirmed = makeUserDto(2);
      await auth.registration(unconfirmed).expect(204);

      const token = await auth.loginAndGetToken(
        unconfirmed.login,
        unconfirmed.password,
      );

      await auth.me(token).expect(200);
    });
  });

  describe('401 — неверные учётные данные', () => {
    it('неверный пароль', async () => {
      await auth
        .login({ loginOrEmail: user.login, password: 'wrong-password' })
        .expect(401);
    });

    it('несуществующий login', async () => {
      await auth
        .login({ loginOrEmail: 'nosuchuser', password: user.password })
        .expect(401);
    });

    it('несуществующий email', async () => {
      await auth
        .login({ loginOrEmail: 'nosuch@example.com', password: user.password })
        .expect(401);
    });

    it('login в другом регистре', async () => {
      // Фиксируем регистрозависимость login при входе.
      await auth
        .login({
          loginOrEmail: user.login.toUpperCase(),
          password: user.password,
        })
        .expect(401);
    });

    it('пароль в другом регистре', async () => {
      await auth
        .login({
          loginOrEmail: user.login,
          password: user.password.toUpperCase(),
        })
        .expect(401);
    });

    it('401 не раскрывает, существует ли пользователь (пустое тело)', async () => {
      const wrongPassword = await auth
        .login({ loginOrEmail: user.login, password: 'wrong-password' })
        .expect(401);
      const noSuchUser = await auth
        .login({ loginOrEmail: 'nosuchuser', password: user.password })
        .expect(401);

      expect(wrongPassword.body).toEqual(noSuchUser.body);
    });
  });

  describe('400 — валидация входной модели', () => {
    it('отсутствует loginOrEmail', async () => {
      const response = await auth
        .login({ password: user.password })
        .expect(400);

      expectErrorsForFields(response.body, ['loginOrEmail']);
    });

    it('отсутствует password', async () => {
      const response = await auth
        .login({ loginOrEmail: user.login })
        .expect(400);

      expectErrorsForFields(response.body, ['password']);
    });

    it('пустое тело', async () => {
      const response = await auth.login({}).expect(400);

      expectErrorsForFields(response.body, ['loginOrEmail', 'password']);
    });

    it('loginOrEmail — пустая строка', async () => {
      const response = await auth
        .login({ loginOrEmail: '', password: user.password })
        .expect(400);

      expectErrorsForFields(response.body, ['loginOrEmail']);
    });

    it('password — пустая строка', async () => {
      const response = await auth
        .login({ loginOrEmail: user.login, password: '' })
        .expect(400);

      expectErrorsForFields(response.body, ['password']);
    });

    it('loginOrEmail не строка', async () => {
      const response = await auth
        .login({ loginOrEmail: 123, password: user.password })
        .expect(400);

      expectErrorsForFields(response.body, ['loginOrEmail']);
    });
  });
});

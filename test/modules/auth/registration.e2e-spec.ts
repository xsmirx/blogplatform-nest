import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { AuthTestManager } from '../../helpers/auth.test-manager.js';
import { makeUserDto, repeat } from '../../helpers/data.js';
import { expectErrorsForFields } from '../../helpers/expected.js';

describe('POST /auth/registration — самостоятельная регистрация', () => {
  let ctx: TestAppContext;
  let auth: AuthTestManager;

  beforeAll(async () => {
    ctx = await initApp();
    auth = new AuthTestManager(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  beforeEach(async () => {
    await clearDb(ctx);
  });

  describe('204 — успешная регистрация', () => {
    it('возвращает 204 с пустым телом', async () => {
      const response = await auth.registration(makeUserDto(1)).expect(204);

      expect(response.body).toEqual({});
    });

    it('не требует авторизации', async () => {
      await auth.registration(makeUserDto(1)).expect(204);
    });

    it('отправляет ровно одно письмо с кодом подтверждения на указанный email', async () => {
      const dto = makeUserDto(1);

      await auth.registration(dto).expect(204);

      expect(
        ctx.emailService.sendRegistrationConfirmation,
      ).toHaveBeenCalledTimes(1);
      expect(ctx.emailService.registrationEmails).toEqual([
        { email: dto.email, code: expect.any(String) },
      ]);
      expect(
        ctx.emailService.lastRegistrationCodeFor(dto.email).length,
      ).toBeGreaterThan(0);
    });

    it('разным пользователям уходят разные коды', async () => {
      const first = makeUserDto(1);
      const second = makeUserDto(2);

      await auth.registration(first).expect(204);
      await auth.registration(second).expect(204);

      expect(ctx.emailService.lastRegistrationCodeFor(first.email)).not.toBe(
        ctx.emailService.lastRegistrationCodeFor(second.email),
      );
    });

    it('неподтверждённый пользователь не может залогиниться', async () => {
      // Требование курса: до подтверждения email вход запрещён.
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);

      await auth
        .login({ loginOrEmail: dto.login, password: dto.password })
        .expect(401);
    });

    it('принимает граничные валидные значения', async () => {
      await auth
        .registration({
          login: repeat('a', 3),
          password: repeat('p', 6),
          email: 'min@example.com',
        })
        .expect(204);

      await auth
        .registration({
          login: repeat('b', 10),
          password: repeat('p', 20),
          email: 'max@example.com',
        })
        .expect(204);
    });
  });

  describe('400 — валидация login', () => {
    it.each([
      ['короче 3 символов', repeat('a', 2)],
      ['длиннее 10 символов', repeat('a', 11)],
      ['пустая строка', ''],
      ['пробел внутри', 'user name'],
      ['недопустимый символ', 'user!'],
    ])('%s', async (_name, login) => {
      const response = await auth
        .registration(makeUserDto(1, { login }))
        .expect(400);

      expectErrorsForFields(response.body, ['login']);
    });

    it('поле отсутствует', async () => {
      const { password, email } = makeUserDto(1);

      const response = await auth.registration({ password, email }).expect(400);

      expectErrorsForFields(response.body, ['login']);
    });
  });

  describe('400 — валидация password', () => {
    it.each([
      ['короче 6 символов', repeat('p', 5)],
      ['длиннее 20 символов', repeat('p', 21)],
      ['пустая строка', ''],
    ])('%s', async (_name, password) => {
      const response = await auth
        .registration(makeUserDto(1, { password }))
        .expect(400);

      expectErrorsForFields(response.body, ['password']);
    });

    it('поле отсутствует', async () => {
      const { login, email } = makeUserDto(1);

      const response = await auth.registration({ login, email }).expect(400);

      expectErrorsForFields(response.body, ['password']);
    });
  });

  describe('400 — валидация email', () => {
    it.each([
      ['без @', 'not-an-email'],
      ['с ^ вместо @', '222^gmail.com'],
      ['без домена верхнего уровня', 'user@example'],
      ['пустая строка', ''],
    ])('%s', async (_name, email) => {
      const response = await auth
        .registration(makeUserDto(1, { email }))
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('поле отсутствует', async () => {
      const { login, password } = makeUserDto(1);

      const response = await auth.registration({ login, password }).expect(400);

      expectErrorsForFields(response.body, ['email']);
    });
  });

  describe('400 — занятые login / email', () => {
    it('login уже занят (пользователь зарегистрировался сам)', async () => {
      const first = makeUserDto(1);
      await auth.registration(first).expect(204);

      const response = await auth
        .registration(makeUserDto(2, { login: first.login }))
        .expect(400);

      expectErrorsForFields(response.body, ['login']);
    });

    it('email уже занят (пользователь зарегистрировался сам)', async () => {
      const first = makeUserDto(1);
      await auth.registration(first).expect(204);

      const response = await auth
        .registration(makeUserDto(2, { email: first.email }))
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('login занят подтверждённым пользователем', async () => {
      const existing = makeUserDto(1);
      await auth.registerAndConfirm(existing);

      const response = await auth
        .registration(makeUserDto(2, { login: existing.login }))
        .expect(400);

      expectErrorsForFields(response.body, ['login']);
    });

    it('email занят подтверждённым пользователем', async () => {
      const existing = makeUserDto(1);
      await auth.registerAndConfirm(existing);

      const response = await auth
        .registration(makeUserDto(2, { email: existing.email }))
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('при занятом login письмо не отправляется', async () => {
      const first = makeUserDto(1);
      await auth.registration(first).expect(204);
      ctx.emailService.clear();

      await auth
        .registration(makeUserDto(2, { login: first.login }))
        .expect(400);

      expect(
        ctx.emailService.sendRegistrationConfirmation,
      ).not.toHaveBeenCalled();
    });

    it('при 400 новый пользователь не создаётся', async () => {
      const first = makeUserDto(1);
      await auth.registration(first).expect(204);
      const rejected = makeUserDto(2, { login: first.login });

      await auth.registration(rejected).expect(400);

      // Если бы пользователь с этим email создался, переотправка
      // письма для него вернула бы 204.
      await auth.resendRegistrationEmail({ email: rejected.email }).expect(400);
    });
  });

  describe('400 — пустое тело', () => {
    it('ошибки по всем трём полям', async () => {
      const response = await auth.registration({}).expect(400);

      expectErrorsForFields(response.body, ['login', 'password', 'email']);
    });
  });
});

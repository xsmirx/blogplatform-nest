import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { AuthTestManager } from '../../helpers/auth.test-manager.js';
import { makeUserDto, type UserInputModel } from '../../helpers/data.js';
import { expectErrorsForFields } from '../../helpers/expected.js';

describe('POST /auth/password-recovery — запрос восстановления пароля', () => {
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
    // Письмо о регистрации здесь не интересно — начинаем с чистого ящика.
    ctx.emailService.clear();
  });

  describe('204 — существующий email', () => {
    it('возвращает 204 с пустым телом', async () => {
      const response = await auth
        .passwordRecovery({ email: user.email })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('отправляет письмо с recoveryCode', async () => {
      await auth.passwordRecovery({ email: user.email }).expect(204);

      expect(ctx.emailService.sendPasswordRecovery).toHaveBeenCalledTimes(1);
      expect(ctx.emailService.passwordRecoveryEmails).toEqual([
        { email: user.email, code: expect.any(String) },
      ]);
    });

    it('не требует авторизации', async () => {
      await auth.passwordRecovery({ email: user.email }).expect(204);
    });

    it('повторный запрос выдаёт новый код', async () => {
      await auth.passwordRecovery({ email: user.email }).expect(204);
      await auth.passwordRecovery({ email: user.email }).expect(204);

      const codes = ctx.emailService.passwordRecoveryCodesFor(user.email);
      expect(codes).toHaveLength(2);
      expect(codes[0]).not.toBe(codes[1]);
    });

    it('работает для неподтверждённого пользователя', async () => {
      const unconfirmed = makeUserDto(2);
      await auth.registration(unconfirmed).expect(204);

      await auth.passwordRecovery({ email: unconfirmed.email }).expect(204);
    });

    it('не отправляет письмо подтверждения регистрации', async () => {
      ctx.emailService.clear();

      await auth.passwordRecovery({ email: user.email }).expect(204);

      expect(
        ctx.emailService.sendRegistrationConfirmation,
      ).not.toHaveBeenCalled();
    });
  });

  describe('204 — несуществующий email (защита от перебора)', () => {
    it('возвращает 204, хотя пользователя нет', async () => {
      await auth.passwordRecovery({ email: 'unknown@example.com' }).expect(204);
    });

    it('письмо при этом не отправляется', async () => {
      ctx.emailService.clear();

      await auth.passwordRecovery({ email: 'unknown@example.com' }).expect(204);

      expect(ctx.emailService.sendPasswordRecovery).not.toHaveBeenCalled();
    });

    it('ответы для существующего и несуществующего email неотличимы', async () => {
      const existing = await auth
        .passwordRecovery({ email: user.email })
        .expect(204);
      const missing = await auth
        .passwordRecovery({ email: 'unknown@example.com' })
        .expect(204);

      expect(existing.status).toBe(missing.status);
      expect(existing.body).toEqual(missing.body);
    });
  });

  describe('400 — валидация email', () => {
    it.each([
      ['без @', 'not-an-email'],
      ['с ^ вместо @', '222^gmail.com'],
      ['без домена верхнего уровня', 'user@example'],
      ['пустая строка', ''],
      ['с пробелом', 'user name@example.com'],
    ])('%s', async (_name, email) => {
      const response = await auth.passwordRecovery({ email }).expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('поле отсутствует', async () => {
      const response = await auth.passwordRecovery({}).expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('email не строка', async () => {
      const response = await auth.passwordRecovery({ email: 123 }).expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('при 400 письмо не отправляется', async () => {
      ctx.emailService.clear();

      await auth.passwordRecovery({ email: '222^gmail.com' }).expect(400);

      expect(ctx.emailService.sendPasswordRecovery).not.toHaveBeenCalled();
    });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { AuthTestManager } from '../../helpers/auth.test-manager.js';
import { makeUserDto } from '../../helpers/data.js';
import { expectErrorsForFields } from '../../helpers/expected.js';

describe('POST /auth/registration-email-resending — повторная отправка кода', () => {
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

  describe('204 — успешная переотправка', () => {
    it('возвращает 204 с пустым телом', async () => {
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);

      const response = await auth
        .resendRegistrationEmail({ email: dto.email })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('отправляет второе письмо на тот же адрес', async () => {
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);

      await auth.resendRegistrationEmail({ email: dto.email }).expect(204);

      expect(
        ctx.emailService.sendRegistrationConfirmation,
      ).toHaveBeenCalledTimes(2);
      expect(ctx.emailService.registrationCodesFor(dto.email)).toHaveLength(2);
    });

    it('новый код отличается от старого', async () => {
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);

      await auth.resendRegistrationEmail({ email: dto.email }).expect(204);

      const [first, second] = ctx.emailService.registrationCodesFor(dto.email);
      expect(second).not.toBe(first);
    });

    it('новый код подтверждает регистрацию', async () => {
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);
      await auth.resendRegistrationEmail({ email: dto.email }).expect(204);

      const newCode = ctx.emailService.lastRegistrationCodeFor(dto.email);
      await auth.confirmRegistration({ code: newCode }).expect(204);

      await auth
        .login({ loginOrEmail: dto.login, password: dto.password })
        .expect(200);
    });

    it('старый код становится невалидным', async () => {
      // Требование курса: переотправка инвалидирует предыдущий код.
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);
      const [oldCode] = ctx.emailService.registrationCodesFor(dto.email);

      await auth.resendRegistrationEmail({ email: dto.email }).expect(204);

      const response = await auth
        .confirmRegistration({ code: oldCode })
        .expect(400);

      expectErrorsForFields(response.body, ['code']);
    });

    it('переотправку можно вызвать несколько раз подряд', async () => {
      const dto = makeUserDto(1);
      await auth.registration(dto).expect(204);

      await auth.resendRegistrationEmail({ email: dto.email }).expect(204);
      await auth.resendRegistrationEmail({ email: dto.email }).expect(204);

      const codes = ctx.emailService.registrationCodesFor(dto.email);
      expect(codes).toHaveLength(3);
      expect(new Set(codes).size).toBe(3);
    });
  });

  describe('400 — email не подходит для переотправки', () => {
    it('пользователя с таким email не существует', async () => {
      const response = await auth
        .resendRegistrationEmail({ email: 'unknown@example.com' })
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('email уже подтверждён', async () => {
      const dto = makeUserDto(1);
      await auth.registerAndConfirm(dto);

      const response = await auth
        .resendRegistrationEmail({ email: dto.email })
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('при 400 письмо не отправляется', async () => {
      ctx.emailService.clear();

      await auth
        .resendRegistrationEmail({ email: 'unknown@example.com' })
        .expect(400);

      expect(
        ctx.emailService.sendRegistrationConfirmation,
      ).not.toHaveBeenCalled();
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
        .resendRegistrationEmail({ email })
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('поле отсутствует', async () => {
      const response = await auth.resendRegistrationEmail({}).expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('email не строка', async () => {
      const response = await auth
        .resendRegistrationEmail({ email: 123 })
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });
  });
});

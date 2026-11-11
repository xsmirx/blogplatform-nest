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
  nonExistingUuid,
  repeat,
  type UserInputModel,
} from '../../helpers/data.js';
import { expectErrorsForFields } from '../../helpers/expected.js';

describe('POST /auth/new-password — установка нового пароля', () => {
  let ctx: TestAppContext;
  let auth: AuthTestManager;
  let user: UserInputModel;
  let recoveryCode: string;

  const NEW_PASSWORD = 'new-password-123';

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
    recoveryCode = await auth.requestRecoveryCode(user.email);
  });

  describe('204 — успешная смена пароля', () => {
    it('возвращает 204 с пустым телом', async () => {
      const response = await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('вход с новым паролем работает', async () => {
      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode })
        .expect(204);

      await auth
        .login({ loginOrEmail: user.login, password: NEW_PASSWORD })
        .expect(200);
    });

    it('вход со старым паролем перестаёт работать', async () => {
      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode })
        .expect(204);

      await auth
        .login({ loginOrEmail: user.login, password: user.password })
        .expect(401);
    });

    it('вход по email с новым паролем тоже работает', async () => {
      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode })
        .expect(204);

      await auth
        .login({ loginOrEmail: user.email, password: NEW_PASSWORD })
        .expect(200);
    });

    it('принимает граничные длины пароля (6 и 20)', async () => {
      await auth
        .newPassword({ newPassword: repeat('a', 6), recoveryCode })
        .expect(204);

      const secondCode = await auth.requestRecoveryCode(user.email);
      await auth
        .newPassword({ newPassword: repeat('b', 20), recoveryCode: secondCode })
        .expect(204);
    });

    it('актуален только последний запрошенный код', async () => {
      const secondCode = await auth.requestRecoveryCode(user.email);

      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode: secondCode })
        .expect(204);

      await auth
        .login({ loginOrEmail: user.login, password: NEW_PASSWORD })
        .expect(200);
    });

    it('смена пароля не затрагивает других пользователей', async () => {
      const other = makeUserDto(2);
      await auth.registerAndConfirm(other);

      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode })
        .expect(204);

      await auth
        .login({ loginOrEmail: other.login, password: other.password })
        .expect(200);
    });
  });

  describe('400 — recoveryCode', () => {
    it('несуществующий код', async () => {
      const response = await auth
        .newPassword({
          newPassword: NEW_PASSWORD,
          recoveryCode: nonExistingUuid(),
        })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });

    it('код произвольного формата', async () => {
      const response = await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode: 'garbage' })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });

    it('пустая строка', async () => {
      const response = await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode: '' })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });

    it('поле отсутствует', async () => {
      const response = await auth
        .newPassword({ newPassword: NEW_PASSWORD })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });

    it('код нельзя использовать повторно', async () => {
      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode })
        .expect(204);

      const response = await auth
        .newPassword({ newPassword: 'another-password-1', recoveryCode })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });

    it('после повторного запроса старый код невалиден', async () => {
      const oldCode = recoveryCode;
      await auth.requestRecoveryCode(user.email);

      const response = await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode: oldCode })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });

    it('при невалидном коде пароль не меняется', async () => {
      await auth
        .newPassword({
          newPassword: NEW_PASSWORD,
          recoveryCode: nonExistingUuid(),
        })
        .expect(400);

      await auth
        .login({ loginOrEmail: user.login, password: user.password })
        .expect(200);
    });

    it('код подтверждения регистрации не подходит как recoveryCode', async () => {
      const selfRegistered = makeUserDto(3);
      await auth.registration(selfRegistered).expect(204);
      const confirmationCode = ctx.emailService.lastRegistrationCodeFor(
        selfRegistered.email,
      );

      const response = await auth
        .newPassword({
          newPassword: NEW_PASSWORD,
          recoveryCode: confirmationCode,
        })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });
  });

  describe('400 — валидация newPassword', () => {
    it.each([
      ['короче 6 символов', repeat('a', 5)],
      ['длиннее 20 символов', repeat('a', 21)],
      ['пустая строка', ''],
    ])('%s', async (_name, newPassword) => {
      const response = await auth
        .newPassword({ newPassword, recoveryCode })
        .expect(400);

      expectErrorsForFields(response.body, ['newPassword']);
    });

    it('поле отсутствует', async () => {
      const response = await auth.newPassword({ recoveryCode }).expect(400);

      expectErrorsForFields(response.body, ['newPassword']);
    });

    it('newPassword не строка', async () => {
      const response = await auth
        .newPassword({ newPassword: 123456, recoveryCode })
        .expect(400);

      expectErrorsForFields(response.body, ['newPassword']);
    });

    it('невалидный пароль не расходует recoveryCode', async () => {
      await auth
        .newPassword({ newPassword: repeat('a', 5), recoveryCode })
        .expect(400);

      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode })
        .expect(204);
    });

    it('пустое тело: ошибки по обоим полям', async () => {
      const response = await auth.newPassword({}).expect(400);

      expectErrorsForFields(response.body, ['newPassword', 'recoveryCode']);
    });
  });

  describe('истечение recoveryCode', () => {
    // ConfirmationCodeGenerator читает PASSWORD_RECOVERY_CODE_TTL_MS через
    // ConfigService при каждой генерации кода, поэтому достаточно временно
    // подменить переменную — перезапускать приложение не нужно.
    const SHORT_TTL_MS = 100;
    let originalTtl: string | undefined;

    beforeAll(() => {
      originalTtl = process.env.PASSWORD_RECOVERY_CODE_TTL_MS;
      process.env.PASSWORD_RECOVERY_CODE_TTL_MS = String(SHORT_TTL_MS);
    });

    afterAll(() => {
      if (originalTtl === undefined) {
        delete process.env.PASSWORD_RECOVERY_CODE_TTL_MS;
      } else {
        process.env.PASSWORD_RECOVERY_CODE_TTL_MS = originalTtl;
      }
    });

    const waitForExpiration = () =>
      new Promise((resolve) => setTimeout(resolve, SHORT_TTL_MS * 3));

    it('просроченный recoveryCode отклоняется с 400', async () => {
      const expiringCode = await auth.requestRecoveryCode(user.email);
      await waitForExpiration();

      const response = await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode: expiringCode })
        .expect(400);

      expectErrorsForFields(response.body, ['recoveryCode']);
    });

    it('при просроченном коде пароль не меняется', async () => {
      const expiringCode = await auth.requestRecoveryCode(user.email);
      await waitForExpiration();

      await auth
        .newPassword({ newPassword: NEW_PASSWORD, recoveryCode: expiringCode })
        .expect(400);

      await auth
        .login({ loginOrEmail: user.login, password: user.password })
        .expect(200);
    });
  });
});

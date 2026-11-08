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
  type UserInputModel,
} from '../../helpers/data.js';
import { expectErrorsForFields } from '../../helpers/expected.js';

describe('POST /auth/registration-confirmation — подтверждение регистрации', () => {
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

  /** Регистрирует пользователя и возвращает его dto + код из письма. */
  async function register(
    index = 1,
  ): Promise<{ dto: UserInputModel; code: string }> {
    const dto = makeUserDto(index);
    await auth.registration(dto).expect(204);
    return { dto, code: ctx.emailService.lastRegistrationCodeFor(dto.email) };
  }

  describe('204 — успешное подтверждение', () => {
    it('возвращает 204 с пустым телом', async () => {
      const { code } = await register();

      const response = await auth.confirmRegistration({ code }).expect(204);

      expect(response.body).toEqual({});
    });

    // Логин доступен и без подтверждения, поэтому статус аккаунта
    // проверяем через registration-email-resending: по swagger он
    // работает только для неподтверждённых (204), для подтверждённых — 400.

    it('после подтверждения аккаунт считается подтверждённым', async () => {
      const { dto, code } = await register();

      await auth.confirmRegistration({ code }).expect(204);

      await auth.resendRegistrationEmail({ email: dto.email }).expect(400);
    });

    it('подтверждение одного пользователя не затрагивает другого', async () => {
      const first = await register(1);
      const second = await register(2);

      await auth.confirmRegistration({ code: first.code }).expect(204);

      await auth
        .resendRegistrationEmail({ email: second.dto.email })
        .expect(204);
    });
  });

  describe('400 — код уже использован', () => {
    it('повторное подтверждение тем же кодом', async () => {
      const { code } = await register();
      await auth.confirmRegistration({ code }).expect(204);

      const response = await auth.confirmRegistration({ code }).expect(400);

      expectErrorsForFields(response.body, ['code']);
    });
  });

  describe('400 — некорректный код', () => {
    it('несуществующий код', async () => {
      await register();

      const response = await auth
        .confirmRegistration({ code: nonExistingUuid() })
        .expect(400);

      expectErrorsForFields(response.body, ['code']);
    });

    it('код произвольного формата', async () => {
      const response = await auth
        .confirmRegistration({ code: 'definitely-not-a-code' })
        .expect(400);

      expectErrorsForFields(response.body, ['code']);
    });

    it('пустая строка', async () => {
      const response = await auth.confirmRegistration({ code: '' }).expect(400);

      expectErrorsForFields(response.body, ['code']);
    });

    it('поле code отсутствует', async () => {
      const response = await auth.confirmRegistration({}).expect(400);

      expectErrorsForFields(response.body, ['code']);
    });

    it('code не строка', async () => {
      const response = await auth.confirmRegistration({ code: 42 }).expect(400);

      expectErrorsForFields(response.body, ['code']);
    });

    it('неверный код не подтверждает аккаунт', async () => {
      const { dto } = await register();

      await auth.confirmRegistration({ code: nonExistingUuid() }).expect(400);

      // Аккаунт по-прежнему не подтверждён — переотправка доступна.
      await auth.resendRegistrationEmail({ email: dto.email }).expect(204);
    });
  });

  describe('400 — просроченный код', () => {
    // UserService читает EMAIL_CONFIRMATION_CODE_TTL_MS через ConfigService
    // при каждой генерации кода, а ConfigService смотрит в process.env
    // в момент вызова. Поэтому достаточно временно подменить переменную —
    // перезапускать приложение не нужно.
    const SHORT_TTL_MS = 100;
    let originalTtl: string | undefined;

    beforeAll(() => {
      originalTtl = process.env.EMAIL_CONFIRMATION_CODE_TTL_MS;
      process.env.EMAIL_CONFIRMATION_CODE_TTL_MS = String(SHORT_TTL_MS);
    });

    afterAll(() => {
      if (originalTtl === undefined) {
        delete process.env.EMAIL_CONFIRMATION_CODE_TTL_MS;
      } else {
        process.env.EMAIL_CONFIRMATION_CODE_TTL_MS = originalTtl;
      }
    });

    const waitForExpiration = () =>
      new Promise((resolve) => setTimeout(resolve, SHORT_TTL_MS * 3));

    it('код с истёкшим сроком жизни отклоняется', async () => {
      const { code } = await register();
      await waitForExpiration();

      const response = await auth.confirmRegistration({ code }).expect(400);

      expectErrorsForFields(response.body, ['code']);
    });

  });
});

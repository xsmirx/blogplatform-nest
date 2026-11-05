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

    it('после подтверждения пользователь может залогиниться', async () => {
      const { dto, code } = await register();

      await auth.confirmRegistration({ code }).expect(204);

      await auth
        .login({ loginOrEmail: dto.login, password: dto.password })
        .expect(200);
    });

    it('подтверждение одного пользователя не затрагивает другого', async () => {
      const first = await register(1);
      const second = await register(2);

      await auth.confirmRegistration({ code: first.code }).expect(204);

      await auth
        .login({
          loginOrEmail: second.dto.login,
          password: second.dto.password,
        })
        .expect(401);
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

      await auth
        .login({ loginOrEmail: dto.login, password: dto.password })
        .expect(401);
    });
  });

  describe('400 — просроченный код', () => {
    it.todo(
      'код с истёкшим сроком жизни отклоняется — требует подмены времени (vi.useFakeTimers) ' +
        'или конфигурируемого TTL кода подтверждения',
    );
  });
});

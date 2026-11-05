import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { PATHS, THROTTLE } from '../../setup/constants.js';
import { AuthTestManager } from '../../helpers/auth.test-manager.js';
import { makeUserDto } from '../../helpers/data.js';

/**
 * Rate limiting: не более 5 запросов с одного IP за 10 секунд.
 *
 * Файл вынесен отдельно, потому что:
 *   - приложение здесь поднимается с THROTTLE_ENABLED=true, в остальных
 *     тестах throttler выключен (иначе он ложно срабатывал бы в describe'ах,
 *     где на один эндпоинт уходит больше 5 запросов);
 *   - тесты медленные: часть из них ждёт истечения окна.
 *
 * Отключить файл целиком: SKIP_THROTTLE_TESTS=true pnpm run test:e2e
 *
 * Каждый тест бьёт в СВОЙ эндпоинт — предполагается, что счётчик
 * ведётся отдельно для каждого роута. Благодаря этому тесты не мешают
 * друг другу и не нужно ждать 10 секунд между ними.
 */
const skip = process.env.SKIP_THROTTLE_TESTS === 'true';

describe.skipIf(skip)('Rate limiting на auth-эндпоинтах (429)', () => {
  let ctx: TestAppContext;
  let auth: AuthTestManager;

  const { limit, ttlMs } = THROTTLE;

  beforeAll(async () => {
    ctx = await initApp({ throttling: true });
    auth = new AuthTestManager(ctx);
    await clearDb(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Делает `limit` запросов (ни один не должен быть 429),
   * затем ещё один и возвращает его статус.
   */
  async function exhaustLimit(
    makeRequest: () => Promise<number>,
  ): Promise<number> {
    for (let i = 0; i < limit; i++) {
      const status = await makeRequest();
      expect(
        status,
        `запрос №${i + 1} из ${limit} не должен быть 429`,
      ).not.toBe(429);
    }
    return makeRequest();
  }

  it('POST /auth/login: 6-й запрос за 10 секунд отклоняется с 429', async () => {
    const status = await exhaustLimit(async () => {
      const response = await auth.login({
        loginOrEmail: 'someone',
        password: 'password1',
      });
      return response.status;
    });

    expect(status).toBe(429);
  });

  it('POST /auth/registration: 6-й запрос отклоняется с 429', async () => {
    let i = 0;
    const status = await exhaustLimit(async () => {
      const response = await auth.registration(makeUserDto(++i + 100));
      return response.status;
    });

    expect(status).toBe(429);
  });

  it('POST /auth/registration-confirmation: 6-й запрос отклоняется с 429', async () => {
    const status = await exhaustLimit(async () => {
      const response = await auth.confirmRegistration({ code: 'whatever' });
      return response.status;
    });

    expect(status).toBe(429);
  });

  it('POST /auth/registration-email-resending: 6-й запрос отклоняется с 429', async () => {
    const status = await exhaustLimit(async () => {
      const response = await auth.resendRegistrationEmail({
        email: 'nobody@example.com',
      });
      return response.status;
    });

    expect(status).toBe(429);
  });

  it('POST /auth/password-recovery: 6-й запрос отклоняется с 429', async () => {
    const status = await exhaustLimit(async () => {
      const response = await auth.passwordRecovery({
        email: 'nobody@example.com',
      });
      return response.status;
    });

    expect(status).toBe(429);
  });

  it('POST /auth/new-password: 6-й запрос отклоняется с 429', async () => {
    const status = await exhaustLimit(async () => {
      const response = await auth.newPassword({
        newPassword: 'password123',
        recoveryCode: 'whatever',
      });
      return response.status;
    });

    expect(status).toBe(429);
  });

  it('GET /auth/me не ограничивается по частоте', async () => {
    for (let i = 0; i < limit + 2; i++) {
      const response = await auth.me('invalid-token');
      expect(response.status).toBe(401);
    }
  });

  it(
    'счётчик сбрасывается после истечения окна',
    async () => {
      const hit = async () => {
        const response = await ctx
          .http()
          .post(PATHS.auth.login)
          .send({ loginOrEmail: 'window-test', password: 'password1' });
        return response.status;
      };

      // Этот эндпоинт уже «выжат» первым тестом — дожидаемся сброса окна.
      await sleep(ttlMs + 1_000);

      for (let i = 0; i < limit; i++) {
        expect(await hit()).not.toBe(429);
      }
      expect(await hit()).toBe(429);

      await sleep(ttlMs + 1_000);

      expect(await hit()).not.toBe(429);
    },
    ttlMs * 3 + 15_000,
  );
});

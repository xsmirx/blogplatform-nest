import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { THROTTLE } from '../../setup/constants.js';
import { UsersTestManager } from '../../helpers/users.test-manager.js';

/**
 * Rate limiting (5 запросов / 10 сек) в swagger описан только для auth.
 * Здесь проверяем, что админские эндпоинты /users под него не попадают.
 *
 * Отключить: SKIP_THROTTLE_TESTS=true pnpm run test:e2e
 */
const skip = process.env.SKIP_THROTTLE_TESTS === 'true';

describe.skipIf(skip)('Users: rate limiting не применяется', () => {
  let ctx: TestAppContext;
  let users: UsersTestManager;

  beforeAll(async () => {
    ctx = await initApp({ throttling: true });
    users = new UsersTestManager(ctx);
    await clearDb(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  it('GET /users не отвечает 429 при частых запросах', async () => {
    for (let i = 0; i < THROTTLE.limit + 2; i++) {
      const response = await users.getAll();
      expect(response.status).toBe(200);
    }
  });
});

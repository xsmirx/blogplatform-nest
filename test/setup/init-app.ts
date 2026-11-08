import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module.js';
import { appSetup } from '../../src/setup/app.setup.js';
import { EmailServiceMock } from './email.service.mock.js';
import { PATHS } from './constants.js';
import { EmailService } from '../../src/modules/notifications/email.service.js';

/** Supertest-агент, привязанный к http-серверу приложения. */
export type HttpAgent = ReturnType<typeof request>;
/** Одиночный supertest-запрос (то, что возвращает agent.post() и т.п.). */
export type HttpRequest = ReturnType<HttpAgent['post']>;

export type InitAppOptions = {
  /**
   * Включить rate limiting (429). По умолчанию выключен: throttler
   * ломает «обычные» тесты, где в рамках одного describe уходит
   * больше 5 запросов на один и тот же эндпоинт.
   * Включается только в test/modules/auth/throttling.e2e-spec.ts.
   */
  throttling?: boolean;
};

export type TestAppContext = {
  app: INestApplication;
  moduleRef: TestingModule;
  /** Supertest-агент, уже привязанный к http-серверу приложения. */
  http: () => HttpAgent;
  /** Тот же инстанс мока, что подставлен в DI-контейнер. */
  emailService: EmailServiceMock;
};

/**
 * Поднимает тестовое приложение.
 *
 * Отличия от боевого запуска ровно два:
 *   - EmailService подменён на EmailServiceMock;
 *   - THROTTLE_ENABLED управляется опцией.
 * Вся остальная конфигурация берётся из `appSetup()`, общей с main.ts.
 */
export async function initApp(
  options: InitAppOptions = {},
): Promise<TestAppContext> {
  const { throttling = false } = options;

  // process.env имеет приоритет над .env-файлом в @nestjs/config,
  // поэтому выставляем флаг до компиляции модуля.
  process.env.THROTTLE_ENABLED = throttling ? 'true' : 'false';

  const emailService = new EmailServiceMock();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useValue(emailService)
    .compile();

  const app = moduleRef.createNestApplication();
  appSetup(app);
  await app.init();

  return {
    app,
    moduleRef,
    emailService,
    http: () => request(app.getHttpServer()),
  };
}

export async function closeApp(ctx: TestAppContext): Promise<void> {
  await ctx.app.close();
}

/**
 * Полная очистка состояния между тестами:
 * дроп базы через служебный эндпоинт + сброс истории писем.
 */
export async function clearDb(ctx: TestAppContext): Promise<void> {
  await ctx.http().delete(PATHS.testingAllData).expect(204);
  ctx.emailService.clear();
}

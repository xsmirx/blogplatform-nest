import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Единая точка настройки Nest-приложения.
 *
 * Вызывается и из `main.ts` (боевой запуск), и из e2e-тестов
 * (`test/setup/init-app.ts`). Благодаря этому тестовое приложение
 * всегда сконфигурировано так же, как боевое.
 *
 * TODO (h14): сюда же нужно будет добавить
 *   - глобальный exception filter, приводящий ошибки к формату
 *     APIErrorResult: { errorsMessages: [{ message, field }] };
 *   - exceptionFactory для ValidationPipe, собирающий ошибки
 *     class-validator в тот же формат;
 *   - cookie-parser, если появится refreshToken flow.
 * После этого часть e2e-тестов на 400-е ответы позеленеет.
 */
export function appSetup(app: INestApplication): void {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
}

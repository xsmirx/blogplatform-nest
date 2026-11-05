import { expect } from 'vitest';
import type { APIErrorResult, UserInputModel } from './data.js';

/**
 * Ожидаемая форма h05.db.UserViewModel.
 * `additionalProperties: false` в swagger — поэтому сравниваем через
 * toEqual, чтобы лишние поля (например, passwordHash) ломали тест.
 */
export function expectedUserView(dto: Pick<UserInputModel, 'login' | 'email'>) {
  return {
    id: expect.any(String),
    login: dto.login,
    email: dto.email,
    createdAt: expect.any(String),
  };
}

export function expectedMeView(
  dto: Pick<UserInputModel, 'login' | 'email'>,
  userId?: string,
) {
  return {
    userId: userId ?? expect.any(String),
    login: dto.login,
    email: dto.email,
  };
}

export function expectedEmptyPaginator(page = 1, pageSize = 10) {
  return {
    pagesCount: 0,
    page,
    pageSize,
    totalCount: 0,
    items: [],
  };
}

/**
 * Проверяет, что тело ответа — валидный APIErrorResult и содержит
 * ошибку ровно по указанным полям (и только по ним).
 *
 * Требование swagger для POST /users: ошибки уровня BLL (неуникальный
 * email) не смешиваются с ошибками валидации — в errors ровно один элемент.
 */
export function expectErrorsForFields(
  body: unknown,
  fields: string[],
): asserts body is APIErrorResult {
  const result = body as APIErrorResult;

  expect(result).toHaveProperty('errorsMessages');
  expect(Array.isArray(result.errorsMessages)).toBe(true);

  for (const error of result.errorsMessages) {
    expect(error).toEqual({
      message: expect.any(String),
      field: expect.any(String),
    });
    expect(error.message.length).toBeGreaterThan(0);
  }

  const actualFields = result.errorsMessages.map((e) => e.field).sort();
  expect(actualFields).toEqual([...fields].sort());
}

/** ISO-строка даты (createdAt в swagger — format: date-time). */
export function expectIsoDate(value: unknown): void {
  expect(typeof value).toBe('string');
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
  expect(new Date(value as string).toISOString()).toBe(value);
}

/** Грубая проверка, что строка похожа на JWT: три base64url-сегмента. */
export function expectJwtShape(token: unknown): void {
  expect(typeof token).toBe('string');
  expect(token as string).toMatch(
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  );
}

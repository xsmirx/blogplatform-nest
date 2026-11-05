/** Модели запросов/ответов из h14.json, продублированные для тестов. */

export type UserInputModel = {
  login: string;
  password: string;
  email: string;
};

export type UserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export type MeViewModel = {
  userId: string;
  login: string;
  email: string;
};

export type LoginSuccessViewModel = {
  accessToken: string;
};

export type FieldError = {
  message: string;
  field: string;
};

export type APIErrorResult = {
  errorsMessages: FieldError[];
};

export type Paginator<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

/**
 * Детерминированный генератор валидного UserInputModel.
 * login укладывается в 3..10 символов и в паттерн ^[a-zA-Z0-9_-]*$.
 */
export function makeUserDto(
  index: number,
  overrides: Partial<UserInputModel> = {},
): UserInputModel {
  return {
    login: `user${index}`,
    password: `password${index}`,
    email: `user${index}@example.com`,
    ...overrides,
  };
}

/** Строка заданной длины из допустимых для login символов. */
export function repeat(char: string, length: number): string {
  return char.repeat(length);
}

/** Случайный несуществующий, но валидный по форме ObjectId. */
export function nonExistingObjectId(): string {
  return '000000000000000000000001';
}

/** Случайный несуществующий, но валидный по форме uuid-код. */
export function nonExistingUuid(): string {
  return '11111111-2222-3333-4444-555555555555';
}

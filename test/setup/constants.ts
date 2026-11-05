/**
 * Общие константы e2e-тестов.
 *
 * Базовый префикс путей отсутствует (решение по проекту): контроллеры
 * отвечают на /users, /auth/..., /testing/... . В опубликованном swagger
 * пути выглядят как /hometask_14/api/... — это префикс хостинга, в самом
 * приложении он не воспроизводится.
 */

export const PATHS = {
  users: '/users',
  testingAllData: '/testing/all-data',
  auth: {
    login: '/auth/login',
    me: '/auth/me',
    registration: '/auth/registration',
    registrationConfirmation: '/auth/registration-confirmation',
    registrationEmailResending: '/auth/registration-email-resending',
    passwordRecovery: '/auth/password-recovery',
    newPassword: '/auth/new-password',
  },
} as const;

export type BasicCredentials = {
  username: string;
  password: string;
};

/** Валидные креды для Basic Auth, берутся из .env.test.local */
export const VALID_BASIC_AUTH: BasicCredentials = {
  username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
  password: process.env.BASIC_AUTH_PASSWORD ?? 'qwerty',
};

export const INVALID_BASIC_AUTH: BasicCredentials = {
  username: 'hacker',
  password: 'wrong-password',
};

/** Ограничения из swagger (h05.db.UserInputModel) */
export const USER_CONSTRAINTS = {
  login: { min: 3, max: 10, pattern: /^[a-zA-Z0-9_-]*$/ },
  password: { min: 6, max: 20 },
  email: { pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ },
} as const;

/** Настройки rate limiting из swagger: не более 5 запросов за 10 секунд */
export const THROTTLE = {
  limit: Number(process.env.THROTTLE_LIMIT ?? 5),
  ttlMs: Number(process.env.THROTTLE_TTL_MS ?? 10_000),
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 20;

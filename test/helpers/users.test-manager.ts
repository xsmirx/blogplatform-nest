import { expect } from 'vitest';
import type { HttpRequest, TestAppContext } from '../setup/init-app.js';
import {
  PATHS,
  VALID_BASIC_AUTH,
  type BasicCredentials,
} from '../setup/constants.js';
import {
  makeUserDto,
  type UserInputModel,
  type UserViewModel,
} from './data.js';

export type UsersQuery = Partial<{
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  pageNumber: number | string;
  pageSize: number | string;
  searchLoginTerm: string;
  searchEmailTerm: string;
}>;

/**
 * Обёртка над HTTP-вызовами модуля Users (/users, Basic Auth).
 * Методы возвращают незавершённый supertest-запрос, чтобы тест
 * сам дописал `.expect(...)`.
 */
export class UsersTestManager {
  constructor(private readonly ctx: TestAppContext) {}

  create(
    dto: Partial<UserInputModel>,
    auth: BasicCredentials | null = VALID_BASIC_AUTH,
  ): HttpRequest {
    const req = this.ctx.http().post(PATHS.users).send(dto);
    return auth ? req.auth(auth.username, auth.password) : req;
  }

  getAll(
    query: UsersQuery = {},
    auth: BasicCredentials | null = VALID_BASIC_AUTH,
  ): HttpRequest {
    const req = this.ctx.http().get(PATHS.users).query(query);
    return auth ? req.auth(auth.username, auth.password) : req;
  }

  delete(
    id: string,
    auth: BasicCredentials | null = VALID_BASIC_AUTH,
  ): HttpRequest {
    const req = this.ctx.http().delete(`${PATHS.users}/${id}`);
    return auth ? req.auth(auth.username, auth.password) : req;
  }

  /** Создаёт пользователя и возвращает его view-модель. */
  async createAndGet(dto: UserInputModel): Promise<UserViewModel> {
    const response = await this.create(dto).expect(201);
    return response.body as UserViewModel;
  }

  /**
   * Создаёт `count` пользователей последовательно (user1..userN).
   * Последовательно — чтобы createdAt гарантированно возрастал
   * и тесты сортировки по умолчанию были детерминированными.
   */
  async createMany(
    count: number,
    startIndex = 1,
  ): Promise<{ dtos: UserInputModel[]; views: UserViewModel[] }> {
    const dtos: UserInputModel[] = [];
    const views: UserViewModel[] = [];

    for (let i = startIndex; i < startIndex + count; i++) {
      const dto = makeUserDto(i);
      dtos.push(dto);
      views.push(await this.createAndGet(dto));
      // createdAt хранится с точностью до миллисекунд — страхуемся
      // от двух пользователей с одинаковой меткой времени.
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    return { dtos, views };
  }

  /** Логины пользователей из текущего списка (в порядке выдачи API). */
  async loginsInList(query: UsersQuery = {}): Promise<string[]> {
    const response = await this.getAll(query).expect(200);
    const body = response.body as { items: UserViewModel[] };
    expect(Array.isArray(body.items)).toBe(true);
    return body.items.map((u) => u.login);
  }
}

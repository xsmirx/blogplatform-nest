import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import {
  DEFAULT_PAGE_SIZE,
  INVALID_BASIC_AUTH,
  MAX_PAGE_SIZE,
  PATHS,
} from '../../setup/constants.js';
import { UsersTestManager } from '../../helpers/users.test-manager.js';
import {
  makeUserDto,
  type Paginator,
  type UserViewModel,
} from '../../helpers/data.js';
import {
  expectedEmptyPaginator,
  expectedUserView,
} from '../../helpers/expected.js';

type UsersPage = Paginator<UserViewModel>;

describe('GET /users — список пользователей (Basic Auth)', () => {
  let ctx: TestAppContext;
  let users: UsersTestManager;

  beforeAll(async () => {
    ctx = await initApp();
    users = new UsersTestManager(ctx);
  });

  afterAll(async () => {
    await closeApp(ctx);
  });

  beforeEach(async () => {
    await clearDb(ctx);
  });

  describe('401 — Basic Auth', () => {
    it('без заголовка Authorization', async () => {
      await users.getAll({}, null).expect(401);
    });

    it('с неверными credentials', async () => {
      await users.getAll({}, INVALID_BASIC_AUTH).expect(401);
    });

    it('с Bearer-токеном вместо Basic', async () => {
      await ctx
        .http()
        .get(PATHS.users)
        .set('Authorization', 'Bearer some.jwt.token')
        .expect(401);
    });
  });

  describe('200 — структура ответа', () => {
    it('пустая база: пустой пагинатор с дефолтами', async () => {
      const response = await users.getAll().expect(200);

      expect(response.body).toEqual(
        expectedEmptyPaginator(1, DEFAULT_PAGE_SIZE),
      );
    });

    it('элементы соответствуют UserViewModel', async () => {
      const dto = makeUserDto(1);
      await users.createAndGet(dto);

      const response = await users.getAll().expect(200);
      const body = response.body as UsersPage;

      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toEqual(expectedUserView(dto));
    });

    it('pagesCount считается как ceil(totalCount / pageSize)', async () => {
      await users.createMany(12);

      const response = await users.getAll({ pageSize: 5 }).expect(200);
      const body = response.body as UsersPage;

      expect(body.totalCount).toBe(12);
      expect(body.pageSize).toBe(5);
      expect(body.pagesCount).toBe(3);
    });

    it('не содержит лишних полей верхнего уровня', async () => {
      const response = await users.getAll().expect(200);

      expect(Object.keys(response.body as object).sort()).toEqual([
        'items',
        'page',
        'pageSize',
        'pagesCount',
        'totalCount',
      ]);
    });
  });

  describe('пагинация', () => {
    beforeEach(async () => {
      await users.createMany(5);
    });

    it('дефолтные значения: page=1, pageSize=10', async () => {
      const response = await users.getAll().expect(200);
      const body = response.body as UsersPage;

      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(body.items).toHaveLength(5);
    });

    it('pageNumber=2 при pageSize=2 отдаёт вторую порцию', async () => {
      // по умолчанию сортировка createdAt desc → user5..user1
      const page1 = await users.loginsInList({ pageNumber: 1, pageSize: 2 });
      const page2 = await users.loginsInList({ pageNumber: 2, pageSize: 2 });

      expect(page1).toEqual(['user5', 'user4']);
      expect(page2).toEqual(['user3', 'user2']);
    });

    it('последняя страница может быть неполной', async () => {
      const response = await users
        .getAll({ pageNumber: 3, pageSize: 2 })
        .expect(200);
      const body = response.body as UsersPage;

      expect(body.items).toHaveLength(1);
      expect(body.page).toBe(3);
      expect(body.pagesCount).toBe(3);
    });

    it('запрос страницы за пределами диапазона отдаёт пустой items', async () => {
      const response = await users.getAll({ pageNumber: 99 }).expect(200);
      const body = response.body as UsersPage;

      expect(body.items).toEqual([]);
      expect(body.totalCount).toBe(5);
      expect(body.page).toBe(99);
    });

    it('некорректный pageNumber откатывается к дефолту', async () => {
      const response = await users.getAll({ pageNumber: 'abc' }).expect(200);
      const body = response.body as UsersPage;

      expect(body.page).toBe(1);
      expect(body.items).toHaveLength(5);
    });
  });

  describe('ограничение pageSize', () => {
    it('pageSize больше 20 не отдаёт больше 20 элементов', async () => {
      // Swagger: pageSize maximum = 20.
      await users.createMany(25);

      const response = await users.getAll({ pageSize: 100 }).expect(200);
      const body = response.body as UsersPage;

      expect(body.items.length).toBeLessThanOrEqual(MAX_PAGE_SIZE);
    });

    it('pageSize = 20 работает', async () => {
      await users.createMany(21);

      const response = await users.getAll({ pageSize: 20 }).expect(200);
      const body = response.body as UsersPage;

      expect(body.pageSize).toBe(20);
      expect(body.items).toHaveLength(20);
    });
  });

  describe('сортировка', () => {
    beforeEach(async () => {
      await users.createMany(3);
    });

    it('по умолчанию createdAt desc — новые первыми', async () => {
      expect(await users.loginsInList()).toEqual(['user3', 'user2', 'user1']);
    });

    it('sortDirection=asc меняет порядок на обратный', async () => {
      expect(await users.loginsInList({ sortDirection: 'asc' })).toEqual([
        'user1',
        'user2',
        'user3',
      ]);
    });

    it('sortBy=login + asc', async () => {
      expect(
        await users.loginsInList({ sortBy: 'login', sortDirection: 'asc' }),
      ).toEqual(['user1', 'user2', 'user3']);
    });

    it('sortBy=login + desc', async () => {
      expect(
        await users.loginsInList({ sortBy: 'login', sortDirection: 'desc' }),
      ).toEqual(['user3', 'user2', 'user1']);
    });

    it('sortBy=email + asc', async () => {
      expect(
        await users.loginsInList({ sortBy: 'email', sortDirection: 'asc' }),
      ).toEqual(['user1', 'user2', 'user3']);
    });

    it('неизвестный sortBy не ломает запрос', async () => {
      const response = await users.getAll({ sortBy: 'nonExistingField' });

      expect(response.status).toBe(200);
      expect((response.body as UsersPage).items).toHaveLength(3);
    });
  });

  describe('поиск: searchLoginTerm', () => {
    beforeEach(async () => {
      await users.createAndGet(
        makeUserDto(1, { login: 'johnny', email: 'johnny@mail.com' }),
      );
      await users.createAndGet(
        makeUserDto(2, { login: 'jane', email: 'jane@mail.com' }),
      );
      await users.createAndGet(
        makeUserDto(3, { login: 'bobby', email: 'bobby@mail.com' }),
      );
    });

    it('находит по вхождению в середине строки', async () => {
      expect(await users.loginsInList({ searchLoginTerm: 'ohn' })).toEqual([
        'johnny',
      ]);
    });

    it('поиск регистронезависимый', async () => {
      expect(await users.loginsInList({ searchLoginTerm: 'JOHN' })).toEqual([
        'johnny',
      ]);
    });

    it('находит нескольких пользователей', async () => {
      const logins = await users.loginsInList({ searchLoginTerm: 'j' });

      expect(logins.sort()).toEqual(['jane', 'johnny']);
    });

    it('ничего не найдено — пустой пагинатор', async () => {
      const response = await users
        .getAll({ searchLoginTerm: 'nonexistent' })
        .expect(200);
      const body = response.body as UsersPage;

      expect(body.items).toEqual([]);
      expect(body.totalCount).toBe(0);
      expect(body.pagesCount).toBe(0);
    });

    it('totalCount учитывает только найденных', async () => {
      const response = await users.getAll({ searchLoginTerm: 'j' }).expect(200);

      expect((response.body as UsersPage).totalCount).toBe(2);
    });

    it('не ищет по email', async () => {
      expect(await users.loginsInList({ searchLoginTerm: 'mail.com' })).toEqual(
        [],
      );
    });
  });

  describe('поиск: searchEmailTerm', () => {
    beforeEach(async () => {
      await users.createAndGet(
        makeUserDto(1, { login: 'alpha', email: 'alpha@gmail.com' }),
      );
      await users.createAndGet(
        makeUserDto(2, { login: 'beta', email: 'beta@yandex.ru' }),
      );
    });

    it('находит по домену', async () => {
      expect(await users.loginsInList({ searchEmailTerm: 'gmail' })).toEqual([
        'alpha',
      ]);
    });

    it('поиск регистронезависимый', async () => {
      expect(await users.loginsInList({ searchEmailTerm: 'YANDEX' })).toEqual([
        'beta',
      ]);
    });

    it('не ищет по login', async () => {
      expect(await users.loginsInList({ searchEmailTerm: 'alpha@' })).toEqual([
        'alpha',
      ]);
      expect(await users.loginsInList({ searchEmailTerm: 'beta@' })).toEqual([
        'beta',
      ]);
    });
  });

  describe('поиск: searchLoginTerm + searchEmailTerm', () => {
    beforeEach(async () => {
      await users.createAndGet(
        makeUserDto(1, { login: 'tomcat', email: 'tom@mail.com' }),
      );
      await users.createAndGet(
        makeUserDto(2, { login: 'jerry', email: 'jerry@gmail.com' }),
      );
      await users.createAndGet(
        makeUserDto(3, { login: 'spike', email: 'spike@yandex.ru' }),
      );
    });

    it('термы объединяются по ИЛИ, а не по И', async () => {
      // Спецификация курса: searchLoginTerm OR searchEmailTerm.
      const logins = await users.loginsInList({
        searchLoginTerm: 'tom',
        searchEmailTerm: 'gmail',
      });

      expect(logins.sort()).toEqual(['jerry', 'tomcat']);
    });

    it('пользователь, подходящий под оба терма, не дублируется', async () => {
      const logins = await users.loginsInList({
        searchLoginTerm: 'tom',
        searchEmailTerm: 'tom',
      });

      expect(logins).toEqual(['tomcat']);
    });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDb,
  closeApp,
  initApp,
  type TestAppContext,
} from '../../setup/init-app.js';
import { INVALID_BASIC_AUTH, PATHS } from '../../setup/constants.js';
import { UsersTestManager } from '../../helpers/users.test-manager.js';
import { makeUserDto, repeat, type UserViewModel } from '../../helpers/data.js';
import {
  expectErrorsForFields,
  expectedUserView,
  expectIsoDate,
} from '../../helpers/expected.js';

describe('POST /users — создание пользователя админом (Basic Auth)', () => {
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

  describe('201 — успешное создание', () => {
    it('возвращает созданного пользователя в формате UserViewModel', async () => {
      const dto = makeUserDto(1);

      const response = await users.create(dto).expect(201);

      expect(response.body).toEqual(expectedUserView(dto));
    });

    it('createdAt — валидная ISO-строка', async () => {
      const response = await users.create(makeUserDto(1)).expect(201);

      expectIsoDate((response.body as UserViewModel).createdAt);
    });

    it('не возвращает password и passwordHash', async () => {
      const response = await users.create(makeUserDto(1)).expect(201);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(Object.keys(response.body as object).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'login',
      ]);
    });

    it('созданный пользователь появляется в GET /users', async () => {
      const dto = makeUserDto(1);
      const created = await users.createAndGet(dto);

      const list = await users.getAll().expect(200);

      expect((list.body as { totalCount: number }).totalCount).toBe(1);
      expect((list.body as { items: UserViewModel[] }).items[0]).toEqual(
        created,
      );
    });

    it('принимает граничные валидные значения (login 3 и 10 символов, password 6 и 20)', async () => {
      await users
        .create({
          login: repeat('a', 3),
          password: repeat('p', 6),
          email: 'min@example.com',
        })
        .expect(201);

      await users
        .create({
          login: repeat('b', 10),
          password: repeat('p', 20),
          email: 'max@example.com',
        })
        .expect(201);
    });

    it('принимает login с символами _ и -', async () => {
      await users
        .create({
          login: 'a_b-c1',
          password: 'password1',
          email: 'symbols@example.com',
        })
        .expect(201);
    });
  });

  describe('401 — Basic Auth', () => {
    it('без заголовка Authorization', async () => {
      await users.create(makeUserDto(1), null).expect(401);
    });

    it('с неверными credentials', async () => {
      await users.create(makeUserDto(1), INVALID_BASIC_AUTH).expect(401);
    });

    it('с Bearer-токеном вместо Basic', async () => {
      await ctx
        .http()
        .post(PATHS.users)
        .set('Authorization', 'Bearer some.jwt.token')
        .send(makeUserDto(1))
        .expect(401);
    });

    it('с некорректной base64-строкой в Basic', async () => {
      await ctx
        .http()
        .post(PATHS.users)
        .set('Authorization', 'Basic not-a-valid-base64!!!')
        .send(makeUserDto(1))
        .expect(401);
    });

    it('401 проверяется раньше валидации тела', async () => {
      await users.create({}, null).expect(401);
    });

    it('не создаёт пользователя при 401', async () => {
      await users.create(makeUserDto(1), null).expect(401);

      const list = await users.getAll().expect(200);
      expect((list.body as { totalCount: number }).totalCount).toBe(0);
    });
  });

  describe('400 — валидация login', () => {
    it.each([
      ['короче 3 символов', repeat('a', 2)],
      ['длиннее 10 символов', repeat('a', 11)],
      ['пустая строка', ''],
      ['недопустимые символы', 'user name'],
      ['недопустимые символы (кириллица)', 'пользователь'],
      ['недопустимые символы (@)', 'user@name'],
    ])('%s', async (_name, login) => {
      const response = await users
        .create(makeUserDto(1, { login }))
        .expect(400);

      expectErrorsForFields(response.body, ['login']);
    });

    it('поле отсутствует', async () => {
      const { password, email } = makeUserDto(1);

      const response = await users.create({ password, email }).expect(400);

      expectErrorsForFields(response.body, ['login']);
    });

    it('не строка (число)', async () => {
      const response = await users
        .create({ ...makeUserDto(1), login: 123 as unknown as string })
        .expect(400);

      expectErrorsForFields(response.body, ['login']);
    });
  });

  describe('400 — валидация password', () => {
    it.each([
      ['короче 6 символов', repeat('p', 5)],
      ['длиннее 20 символов', repeat('p', 21)],
      ['пустая строка', ''],
    ])('%s', async (_name, password) => {
      const response = await users
        .create(makeUserDto(1, { password }))
        .expect(400);

      expectErrorsForFields(response.body, ['password']);
    });

    it('поле отсутствует', async () => {
      const { login, email } = makeUserDto(1);

      const response = await users.create({ login, email }).expect(400);

      expectErrorsForFields(response.body, ['password']);
    });
  });

  describe('400 — валидация email', () => {
    it.each([
      ['без @', 'not-an-email'],
      ['с ^ вместо @', '222^gmail.com'],
      ['без домена верхнего уровня', 'user@example'],
      ['без локальной части', '@example.com'],
      ['пустая строка', ''],
      ['с пробелом', 'user name@example.com'],
    ])('%s', async (_name, email) => {
      const response = await users
        .create(makeUserDto(1, { email }))
        .expect(400);

      expectErrorsForFields(response.body, ['email']);
    });

    it('поле отсутствует', async () => {
      const { login, password } = makeUserDto(1);

      const response = await users.create({ login, password }).expect(400);

      expectErrorsForFields(response.body, ['email']);
    });
  });

  describe('400 — несколько невалидных полей сразу', () => {
    it('возвращает ошибки по всем полям', async () => {
      const response = await users
        .create({ login: '', password: '', email: '' })
        .expect(400);

      expectErrorsForFields(response.body, ['login', 'password', 'email']);
    });

    it('пустое тело запроса', async () => {
      const response = await users.create({}).expect(400);

      expectErrorsForFields(response.body, ['login', 'password', 'email']);
    });
  });

  describe('400 — уникальность login и email', () => {
    it('дубликат login: ровно одна ошибка по полю login', async () => {
      const first = makeUserDto(1);
      await users.createAndGet(first);

      const response = await users
        .create(makeUserDto(2, { login: first.login }))
        .expect(400);

      // Swagger явно требует: BLL-ошибку не смешивать с валидацией,
      // в errorsMessages ровно один элемент.
      expect(
        (response.body as { errorsMessages: unknown[] }).errorsMessages,
      ).toHaveLength(1);
      expectErrorsForFields(response.body, ['login']);
    });

    it('дубликат email: ровно одна ошибка по полю email', async () => {
      const first = makeUserDto(1);
      await users.createAndGet(first);

      const response = await users
        .create(makeUserDto(2, { email: first.email }))
        .expect(400);

      expect(
        (response.body as { errorsMessages: unknown[] }).errorsMessages,
      ).toHaveLength(1);
      expectErrorsForFields(response.body, ['email']);
    });

    it('дубликат не создаёт второго пользователя', async () => {
      const first = makeUserDto(1);
      await users.createAndGet(first);
      await users.create(first).expect(400);

      const list = await users.getAll().expect(200);
      expect((list.body as { totalCount: number }).totalCount).toBe(1);
    });

    it('login сравнивается с учётом регистра независимо от email', async () => {
      // Фиксируем поведение явно: при другом регистре login и другом email
      // создание должно проходить (login хранится как есть).
      // Если в твоей реализации уникальность регистронезависимая —
      // этот тест надо поменять на ожидание 400.
      await users.createAndGet(makeUserDto(1, { login: 'johndoe' }));

      await users.create(makeUserDto(2, { login: 'JohnDoe' })).expect(201);
    });
  });
});

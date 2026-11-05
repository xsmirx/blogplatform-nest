import type { HttpRequest, TestAppContext } from '../setup/init-app.js';
import { PATHS } from '../setup/constants.js';
import type { LoginSuccessViewModel, UserInputModel } from './data.js';

/**
 * Обёртка над HTTP-вызовами модуля Auth.
 * Методы возвращают незавершённый supertest-запрос.
 */
export class AuthTestManager {
  constructor(private readonly ctx: TestAppContext) {}

  registration(dto: Partial<UserInputModel>): HttpRequest {
    return this.ctx.http().post(PATHS.auth.registration).send(dto);
  }

  confirmRegistration(body: { code?: unknown }): HttpRequest {
    return this.ctx.http().post(PATHS.auth.registrationConfirmation).send(body);
  }

  resendRegistrationEmail(body: { email?: unknown }): HttpRequest {
    return this.ctx
      .http()
      .post(PATHS.auth.registrationEmailResending)
      .send(body);
  }

  login(body: { loginOrEmail?: unknown; password?: unknown }): HttpRequest {
    return this.ctx.http().post(PATHS.auth.login).send(body);
  }

  passwordRecovery(body: { email?: unknown }): HttpRequest {
    return this.ctx.http().post(PATHS.auth.passwordRecovery).send(body);
  }

  newPassword(body: {
    newPassword?: unknown;
    recoveryCode?: unknown;
  }): HttpRequest {
    return this.ctx.http().post(PATHS.auth.newPassword).send(body);
  }

  /** GET /auth/me. Если token передан — уходит как Bearer. */
  me(token?: string | null): HttpRequest {
    const req = this.ctx.http().get(PATHS.auth.me);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  }

  /** GET /auth/me с произвольным заголовком Authorization (для негативных кейсов). */
  meWithRawHeader(authorization: string): HttpRequest {
    return this.ctx
      .http()
      .get(PATHS.auth.me)
      .set('Authorization', authorization);
  }

  // ---------- составные сценарии ----------

  /**
   * Регистрация + подтверждение по коду из письма.
   * После вызова пользователь может логиниться.
   */
  async registerAndConfirm(dto: UserInputModel): Promise<void> {
    await this.registration(dto).expect(204);
    const code = this.ctx.emailService.lastRegistrationCodeFor(dto.email);
    await this.confirmRegistration({ code }).expect(204);
  }

  /** Логин с проверкой 200 и возвратом accessToken. */
  async loginAndGetToken(
    loginOrEmail: string,
    password: string,
  ): Promise<string> {
    const response = await this.login({ loginOrEmail, password }).expect(200);
    return (response.body as LoginSuccessViewModel).accessToken;
  }

  /** Запрос восстановления пароля + возврат кода из письма. */
  async requestRecoveryCode(email: string): Promise<string> {
    await this.passwordRecovery({ email }).expect(204);
    return this.ctx.emailService.lastPasswordRecoveryCodeFor(email);
  }
}

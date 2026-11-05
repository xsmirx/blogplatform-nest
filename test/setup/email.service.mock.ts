import { vi } from 'vitest';
import type { EmailService } from '../../src/modules/users-account/infrastucture/email.service.js';

export type SentEmail = {
  email: string;
  code: string;
};

/**
 * Фейковая реализация EmailService для e2e-тестов.
 *
 * Реальной отправки нет: письма складываются в массивы, откуда тест
 * достаёт confirmationCode / recoveryCode. Это единственный способ
 * довести до конца flow подтверждения регистрации и восстановления
 * пароля, т.к. по API коды наружу не отдаются.
 */
export class EmailServiceMock implements EmailService {
  public readonly registrationEmails: SentEmail[] = [];
  public readonly passwordRecoveryEmails: SentEmail[] = [];

  public readonly sendRegistrationConfirmation = vi.fn(
    (email: string, code: string): Promise<void> => {
      this.registrationEmails.push({ email, code });
      return Promise.resolve();
    },
  );

  public readonly sendPasswordRecovery = vi.fn(
    (email: string, code: string): Promise<void> => {
      this.passwordRecoveryEmails.push({ email, code });
      return Promise.resolve();
    },
  );

  /** Сбросить историю отправок и счётчики вызовов. */
  clear(): void {
    this.registrationEmails.length = 0;
    this.passwordRecoveryEmails.length = 0;
    this.sendRegistrationConfirmation.mockClear();
    this.sendPasswordRecovery.mockClear();
  }

  /**
   * Последний код подтверждения регистрации, отправленный на указанный email.
   * Бросает, если письма не было — так тест падает с внятным сообщением,
   * а не с `undefined` в теле запроса.
   */
  lastRegistrationCodeFor(email: string): string {
    return EmailServiceMock.lastCodeFor(
      this.registrationEmails,
      email,
      'registration confirmation',
    );
  }

  /** Все коды подтверждения регистрации для email, в порядке отправки. */
  registrationCodesFor(email: string): string[] {
    return this.registrationEmails
      .filter((m) => m.email === email)
      .map((m) => m.code);
  }

  /** Последний код восстановления пароля, отправленный на указанный email. */
  lastPasswordRecoveryCodeFor(email: string): string {
    return EmailServiceMock.lastCodeFor(
      this.passwordRecoveryEmails,
      email,
      'password recovery',
    );
  }

  /** Все коды восстановления пароля для email, в порядке отправки. */
  passwordRecoveryCodesFor(email: string): string[] {
    return this.passwordRecoveryEmails
      .filter((m) => m.email === email)
      .map((m) => m.code);
  }

  private static lastCodeFor(
    box: SentEmail[],
    email: string,
    kind: string,
  ): string {
    const found = box.filter((m) => m.email === email);
    if (found.length === 0) {
      throw new Error(
        `EmailServiceMock: не найдено письмо "${kind}" для ${email}. ` +
          `Отправленные адреса: [${box.map((m) => m.email).join(', ')}]`,
      );
    }
    return found[found.length - 1]!.code;
  }
}

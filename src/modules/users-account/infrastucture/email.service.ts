import { Injectable } from '@nestjs/common';

/**
 * Контракт сервиса отправки писем.
 *
 * Реализация (nodemailer / SMTP / очередь) пока не написана — это задача h14.
 * Сам класс существует для двух целей:
 *   1. его токен используется в e2e-тестах для `overrideProvider(EmailService)`;
 *   2. он фиксирует сигнатуры, на которые опираются тесты.
 *
 * ВАЖНО: класс должен быть зарегистрирован в providers у UsersAccountModule
 * (и экспортирован, если понадобится в другом модуле), иначе подмена
 * в тестах не сработает — Nest просто не найдёт провайдер для замены.
 */
@Injectable()
export class EmailService {
  /**
   * Письмо с кодом подтверждения регистрации.
   * Код должен уходить внутри ссылки, например:
   * https://some-front.com/confirm-registration?code=YOUR_CODE
   */
  // oxlint-disable-next-line no-unused-vars
  async sendRegistrationConfirmation(
    email: string,
    code: string,
  ): Promise<void> {
    return Promise.reject(
      new Error('EmailService.sendRegistrationConfirmation is not implemented'),
    );
  }

  /**
   * Письмо с кодом восстановления пароля.
   * Код должен уходить внутри ссылки, например:
   * https://some-front.com/password-recovery?recoveryCode=YOUR_CODE
   */
  // oxlint-disable-next-line no-unused-vars
  async sendPasswordRecovery(email: string, code: string): Promise<void> {
    return Promise.reject(
      new Error('EmailService.sendPasswordRecovery is not implemented'),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, randomUUID } from 'node:crypto';

const DEFAULT_EMAIL_CONFIRMATION_CODE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_PASSWORD_RECOVERY_CODE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class ConfirmationCodeGenerator {
  constructor(protected readonly configService: ConfigService) {}

  generateEmailConfirmationCode() {
    const ttlMs = Number(
      this.configService.get<string>('EMAIL_CONFIRMATION_CODE_TTL_MS') ??
        DEFAULT_EMAIL_CONFIRMATION_CODE_TTL_MS,
    );
    return {
      confirmationCode: randomUUID(),
      expirationDate: new Date(Date.now() + ttlMs),
    };
  }

  generatePasswordRecoveryCode() {
    const ttlMs = Number(
      this.configService.get<string>('PASSWORD_RECOVERY_CODE_TTL_MS') ??
        DEFAULT_PASSWORD_RECOVERY_CODE_TTL_MS,
    );

    const uuidCode = randomUUID();
    const codeHash = hash('sha256', uuidCode);

    return {
      code: uuidCode,
      codeHash,
      expirationDate: new Date(Date.now() + ttlMs),
    };
  }
}

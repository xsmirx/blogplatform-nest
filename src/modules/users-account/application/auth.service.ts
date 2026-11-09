import { Injectable } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserRepository } from '../infrastucture/user.repository.js';
import { DomainException } from '../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes.js';
import { EmailService } from '../../notifications/email.service.js';
import { ConfirmationCodeGenerator } from './confirmation-code.generator.js';
import {
  PasswordRecovery,
  type PasswordRecoveryModel,
} from '../domain/password-recovery.entity.js';
import { InjectModel } from '@nestjs/mongoose';
import { PasswordRecoveryRepository } from '../infrastucture/password-recovery.repository.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(PasswordRecovery.name)
    protected readonly passwordRecoveryModel: PasswordRecoveryModel,
    protected readonly passwordRecoveryRepository: PasswordRecoveryRepository,
    protected readonly userService: UserService,
    protected readonly usersRepository: UserRepository,
    protected readonly emailService: EmailService,
    protected readonly codeGenerator: ConfirmationCodeGenerator,
  ) {}

  async recoveryPassword(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return;

    await this.passwordRecoveryRepository.deleteAllByUserId(user.id);

    const { code, codeHash, expirationDate } =
      this.codeGenerator.generatePasswordRecoveryCode();

    const recovery = this.passwordRecoveryModel.createInstance({
      userId: user.id,
      codeHash,
      expirationDate,
    });

    await this.passwordRecoveryRepository.save(recovery);

    await this.emailService.sendPasswordRecovery(email, code);
  }

  async confirmEmail(code: string) {
    const user = await this.usersRepository.findByConfirmationCode(code);
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [{ key: 'code', message: 'Code is wrong' }],
      });

    user.confirmEmail();

    await this.usersRepository.save(user);
  }

  async register({
    login,
    email,
    password,
  }: {
    login: string;
    email: string;
    password: string;
  }) {
    return await this.userService.create({ login, email, password });
  }

  async resendRegistrationEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [{ key: 'email', message: 'User with email not found' }],
      });
    if (user.emailConfirmation.isConfirmed)
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [{ key: 'email', message: 'Email already confirmed' }],
      });

    const { confirmationCode, expirationDate } =
      this.codeGenerator.generateEmailConfirmationCode();
    user.setConfirmationCode(confirmationCode, expirationDate);

    await this.usersRepository.save(user);

    await this.emailService.sendRegistrationConfirmation(
      user.email,
      user.emailConfirmation.confirmationCode,
    );
  }
}

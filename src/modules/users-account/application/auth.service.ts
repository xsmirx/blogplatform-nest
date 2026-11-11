import { Inject, Injectable } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UsersRepository } from '../infrastucture/users.repository.js';
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
import { BcryptAdapter } from '../infrastucture/bcrypt.adapter.js';
import { UserContextDto } from '../guargs/dto/user-context.dto.js';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_SERVICE_INJECT_TOKEN } from '../constants/auth-tokens.inject-constants.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(PasswordRecovery.name)
    protected readonly passwordRecoveryModel: PasswordRecoveryModel,
    protected readonly passwordRecoveryRepository: PasswordRecoveryRepository,
    protected readonly userService: UserService,
    protected readonly usersRepository: UsersRepository,
    protected readonly bcryptAdapter: BcryptAdapter,
    protected readonly emailService: EmailService,
    protected readonly codeGenerator: ConfirmationCodeGenerator,
    @Inject(ACCESS_TOKEN_SERVICE_INJECT_TOKEN)
    protected readonly jwtService: JwtService,
  ) {}

  async login(userId: string) {
    const accessToken = this.jwtService.sign({
      id: userId,
    } satisfies UserContextDto);
    return { accessToken };
  }

  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      return null;
    }
    const isPasswordValid = await this.bcryptAdapter.checkPassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return null;
    }
    return { id: user.id };
  }

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

  async newPassword({
    newPassword,
    recoveryCode,
  }: {
    newPassword: string;
    recoveryCode: string;
  }) {
    const codeHash = this.codeGenerator.hashCode(recoveryCode);

    const recovery =
      await this.passwordRecoveryRepository.findByRecoveryCodeHashAndDelete(
        codeHash,
      );

    if (!recovery)
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [
          {
            key: 'recoveryCode',
            message: 'recoveryCode is incorrect or expired',
          },
        ],
      });

    const user = await this.usersRepository.findById(
      recovery.userId.toString(),
    );

    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [
          {
            key: 'recoveryCode',
            message: 'recoveryCode is incorrect or expired',
          },
        ],
      });

    const passwordHash = await this.bcryptAdapter.generateHash(newPassword);

    user.setPasswordHash(passwordHash);

    await this.usersRepository.save(user);
    await this.passwordRecoveryRepository.deleteAllByUserId(user.id);
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

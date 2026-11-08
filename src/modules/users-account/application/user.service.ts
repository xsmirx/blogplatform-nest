import { Injectable, NotFoundException } from '@nestjs/common';
import { User, type UserModel } from '../domain/user.entity.js';
import { UserRepository } from '../infrastucture/user.repository.js';
import { InjectModel } from '@nestjs/mongoose';
import { BcryptAdapter } from '../infrastucture/bcrypt.adapter.js';
import { DomainException } from '../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes.js';
import { randomUUID } from 'crypto';
import { EmailService } from '../../notifications/email.service.js';
import { ConfigService } from '@nestjs/config';

const DEFAULT_EMAIL_CONFIRMATION_CODE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) protected readonly UserModel: UserModel,
    protected readonly usersRepository: UserRepository,
    protected readonly bcryptAdapter: BcryptAdapter,
    protected readonly emailService: EmailService,
    protected readonly configService: ConfigService,
  ) {}

  async create({
    login,
    email,
    password,
  }: {
    login: string;
    email: string;
    password: string;
  }) {
    const loginUser = await this.usersRepository.findByLogin(login);
    if (loginUser !== null)
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [{ key: 'login', message: 'Login is not unique' }],
      });
    const emailUser = await this.usersRepository.findByEmail(email);
    if (emailUser !== null)
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [{ key: 'email', message: 'Email is not unique' }],
      });

    const passwordHash = await this.bcryptAdapter.generateHash(password);
    const confirmationCode = randomUUID();
    const ttlMs = Number(
      this.configService.get<string>('EMAIL_CONFIRMATION_CODE_TTL_MS') ??
        DEFAULT_EMAIL_CONFIRMATION_CODE_TTL_MS,
    );
    const expirationDate = new Date(Date.now() + ttlMs);
    const user = this.UserModel.createInstance({
      login,
      email,
      passwordHash,
      confirmationCode,
      expirationDate,
    });
    await this.usersRepository.save(user);

    await this.emailService.sendRegistrationConfirmation(
      user.email,
      user.emailConfirmation.confirmationCode,
    );

    return user;
  }

  async confirmUser(code: string) {
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

  async delete(id: string) {
    const result = await this.usersRepository.delete(id);
    if (!result) throw new NotFoundException();
  }
}

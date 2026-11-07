import { Injectable, NotFoundException } from '@nestjs/common';
import { User, type UserModel } from '../domain/user.entity.js';
import { UserRepository } from '../infrastucture/user.repository.js';
import { InjectModel } from '@nestjs/mongoose';
import { BcryptAdapter } from '../infrastucture/bcrypt.adapter.js';
import { DomainException } from '../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes.js';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) protected readonly UserModel: UserModel,
    protected readonly usersRepository: UserRepository,
    protected readonly bcryptAdapter: BcryptAdapter,
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
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const user = this.UserModel.createInstance({
      login,
      email,
      passwordHash,
      confirmationCode,
      expirationDate,
    });
    await this.usersRepository.save(user);

    // s end email confirmaton

    return user;
  }

  async delete(id: string) {
    const result = await this.usersRepository.delete(id);
    if (!result) throw new NotFoundException();
  }
}

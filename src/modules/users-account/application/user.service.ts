import { Injectable, NotFoundException } from '@nestjs/common';
import { User, type UserModel } from '../domain/user.entity.js';
import { UserRepository } from '../infrastucture/user.repository.js';
import { InjectModel } from '@nestjs/mongoose';
import { BcryptAdapter } from '../infrastucture/bcrypt.adapter.js';

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
    const passwordHash = await this.bcryptAdapter.generateHash(password);
    const user = this.UserModel.createInstance({ login, email, passwordHash });
    await this.usersRepository.save(user);
  }

  async delete(id: string) {
    const result = await this.usersRepository.delete(id);
    if (!result) {
      throw new NotFoundException();
    } else {
      return true;
    }
  }
}

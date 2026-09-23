import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity.js';
import { UsersRepository } from './infrastucture/users.repository.js';
import { UserService } from './application/user.service.js';
import { UsersController } from './api/users.controller.js';
import { BcryptAdapter } from './infrastucture/bcrypt.adapter.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UserService, UsersRepository, BcryptAdapter],
})
export class UsersAccountModule {}

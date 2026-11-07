import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity.js';
import { UserRepository } from './infrastucture/user.repository.js';
import { UserService } from './application/user.service.js';
import { UsersController } from './api/users.controller.js';
import { BcryptAdapter } from './infrastucture/bcrypt.adapter.js';
import { UserQueryRepository } from './infrastucture/query/user.query-repository.js';
import { AuthController } from './api/auth.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, AuthController],
  providers: [UserService, UserRepository, UserQueryRepository, BcryptAdapter],
})
export class UsersAccountModule {}

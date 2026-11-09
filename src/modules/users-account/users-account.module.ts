import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity.js';
import { UserRepository } from './infrastucture/user.repository.js';
import { UserService } from './application/user.service.js';
import { UsersController } from './api/users.controller.js';
import { BcryptAdapter } from './infrastucture/bcrypt.adapter.js';
import { UserQueryRepository } from './infrastucture/query/user.query-repository.js';
import { AuthController } from './api/auth.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AuthService } from './application/auth.service.js';
import { ConfirmationCodeGenerator } from './application/confirmation-code.generator.js';
import {
  PasswordRecovery,
  PasswordRecoverySchema,
} from './domain/password-recovery.entity.js';
import { PasswordRecoveryRepository } from './infrastucture/password-recovery.repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: PasswordRecovery.name, schema: PasswordRecoverySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [
    UserService,
    UserRepository,
    UserQueryRepository,
    PasswordRecoveryRepository,
    BcryptAdapter,
    AuthService,
    ConfirmationCodeGenerator,
  ],
})
export class UsersAccountModule {}

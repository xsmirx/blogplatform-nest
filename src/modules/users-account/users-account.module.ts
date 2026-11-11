import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity.js';
import { UsersRepository } from './infrastucture/users.repository.js';
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
import { LocalStrategy } from './guargs/local/local.strategy.js';
import { ConfigService } from '@nestjs/config';
import {
  ACCESS_TOKEN_SERVICE_INJECT_TOKEN,
  REFRESH_TOKEN_SERVICE_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants.js';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './guargs/bearer/jwt.strategy.js';
import { AuthQueryRepository } from './infrastucture/query/auth.query-repository.js';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: PasswordRecovery.name, schema: PasswordRecoverySchema },
    ]),
    PassportModule.register({ session: false }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const enabled = config.get<string>('THROTTLE_ENABLED') !== 'false';
        return [
          {
            ttl: Number(config.get<string>('THROTTLE_TTL_MS') || 10_000),
            limit: Number(config.get<string>('THROTTLE_LIMIT') || 5),
            skipIf: () => !enabled,
          },
        ];
      },
    }),
    NotificationsModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [
    LocalStrategy,
    JwtStrategy,
    UserService,
    UsersRepository,
    UserQueryRepository,
    PasswordRecoveryRepository,
    BcryptAdapter,
    AuthService,
    AuthQueryRepository,
    ConfirmationCodeGenerator,
    {
      provide: ACCESS_TOKEN_SERVICE_INJECT_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.getOrThrow('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
          },
        }),
    },
    {
      provide: REFRESH_TOKEN_SERVICE_INJECT_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.getOrThrow('JWT_REFRESH_SECRET'),
          signOptions: {
            expiresIn: config.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
          },
        }),
    },
  ],
})
export class UsersAccountModule {}

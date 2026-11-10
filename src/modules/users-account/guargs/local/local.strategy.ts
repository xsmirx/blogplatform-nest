import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../application/auth.service.js';
import { DomainException } from '../../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(protected readonly authService: AuthService) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string) {
    const user = await this.authService.validateUser(loginOrEmail, password);
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid username or password',
      });

    return user;
  }
}

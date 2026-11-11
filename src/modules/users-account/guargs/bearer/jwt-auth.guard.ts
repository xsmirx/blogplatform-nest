import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<Т>(err: unknown, user: Т | false) {
    if (err || !user)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    return user;
  }
}

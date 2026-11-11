import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserContextDto } from '../dto/user-context.dto.js';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../infrastucture/users.repository.js';
import { DomainException } from '../../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: UserContextDto): Promise<UserContextDto> {
    const user = await this.usersRepository.findById(payload.id);
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    return payload;
  }
}

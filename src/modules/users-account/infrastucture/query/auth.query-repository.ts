import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository.js';
import { MeViewDto } from '../../api/view-dto/me.view-dto.js';
import { DomainException } from '../../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes.js';

@Injectable()
export class AuthQueryRepository {
  constructor(private usersRepository: UsersRepository) {}

  async me(userId: string): Promise<MeViewDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });

    return MeViewDto.mapToView(user);
  }
}

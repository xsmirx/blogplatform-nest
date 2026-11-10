import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { validationPipe } from '../../../../setup/pipes.setup.js';
import { LoginInputDto } from '../../api/input-dto/login.input-dto.js';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body;
    await validationPipe.transform(body, {
      type: 'body',
      metatype: LoginInputDto,
    });
    return super.canActivate(context) as Promise<boolean>;
  }
}

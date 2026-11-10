import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(protected readonly configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException();
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString();
    const [username, password] = credentials.split(':');

    const validUserName = this.configService.get('BASIC_AUTH_USERNAME');
    const validPassword = this.configService.get('BASIC_AUTH_PASSWORD');

    if (!(username === validUserName && password === validPassword)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}

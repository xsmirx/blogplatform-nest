import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/create-user.input-dto.js';
import { UserViewDto } from './view-dto/user.view-dto.js';
import { UserService } from '../application/user.service.js';

@Controller('auth')
export class AuthController {
  constructor(protected readonly userService: UserService) {}

  @Post('login')
  async login() {}

  @Post('password-recovery')
  async passwordRecovery() {}

  @Post('new-password')
  async newPassword() {}

  @Post('registration-confirmation')
  async registrationConfirmation() {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: CreateUserInputDto) {
    await this.userService.create({
      login: body.login,
      email: body.email,
      password: body.password,
    });
  }

  @Post('registration-email-resending')
  async reghistrationEmailResending() {}

  @Get('me')
  async me() {}
}

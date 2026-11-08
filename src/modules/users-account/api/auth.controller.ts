import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/create-user.input-dto.js';
import { UserService } from '../application/user.service.js';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto.js';

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
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() body: RegistrationConfirmationInputDto,
  ) {
    await this.userService.confirmUser(body.code);
  }

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
  async registrationEmailResending() {}

  @Get('me')
  async me() {}
}

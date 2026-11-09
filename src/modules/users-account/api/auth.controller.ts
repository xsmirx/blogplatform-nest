import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/create-user.input-dto.js';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto.js';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto.js';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto.js';
import { AuthService } from '../application/auth.service.js';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto.js';

@Controller('auth')
export class AuthController {
  constructor(protected readonly authService: AuthService) {}

  @Post('login')
  async login() {}

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: PasswordRecoveryInputDto) {
    await this.authService.recoveryPassword(body.email);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto) {
    await this.authService.newPassword({
      newPassword: body.newPassword,
      recoveryCode: body.recoveryCode,
    });
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() body: RegistrationConfirmationInputDto,
  ) {
    await this.authService.confirmEmail(body.code);
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: CreateUserInputDto) {
    await this.authService.register({
      login: body.login,
      email: body.email,
      password: body.password,
    });
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() body: RegistrationEmailResendingInputDto,
  ) {
    await this.authService.resendRegistrationEmail(body.email);
  }

  @Get('me')
  async me() {}
}

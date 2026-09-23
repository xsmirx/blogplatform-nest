import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { UserService } from '../application/user.service.js';
import { type CreateUserInputDto } from './input-dto/create-user.input-dto.js';

@Controller('users')
export class UsersController {
  constructor(protected readonly userService: UserService) {}

  @Post()
  public async createUser(@Body() body: CreateUserInputDto) {
    await this.userService.create({
      login: body.login,
      email: body.email,
      password: body.password,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteUser(@Param('id') id: string) {
    await this.userService.delete(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from '../application/user.service.js';
import { type CreateUserInputDto } from './input-dto/create-user.input-dto.js';
import { GetUserListQueryParams } from './input-dto/user-list.intut-dto.js';
import { UserQueryRepository } from '../infrastucture/query/user.query-repository.js';

@Controller('users')
export class UsersController {
  constructor(
    protected readonly userService: UserService,
    protected readonly userQueryRepository: UserQueryRepository,
  ) {}

  @Get()
  public async getAllUsers(@Query() query: GetUserListQueryParams) {
    return await this.userQueryRepository.findAll(query);
  }

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

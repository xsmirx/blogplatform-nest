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
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../application/user.service.js';
import { CreateUserInputDto } from './input-dto/create-user.input-dto.js';
import { GetUserListQueryParams } from './input-dto/user-list.intut-dto.js';
import { UserQueryRepository } from '../infrastucture/query/user.query-repository.js';
import { UserViewDto } from './view-dto/user.view-dto.js';
import { BasicAuthGuard } from '../../../core/guards/basic-auth.guard.js';

@Controller('users')
@UseGuards(BasicAuthGuard)
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
    const user = await this.userService.create({
      login: body.login,
      email: body.email,
      password: body.password,
    });
    return UserViewDto.mapToView(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteUser(@Param('id') id: string) {
    await this.userService.delete(id);
  }
}

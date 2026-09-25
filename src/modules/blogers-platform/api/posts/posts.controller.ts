import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreatePostInputDTO } from './input-dto/create-post.input-dto.js';
import { UpdatePostInputDTO } from './input-dto/update-post.input-dto.js';
import { GetPostListQueryParams } from './input-dto/post-list.input-dto.js';
import { PostsService } from '../../application/posts.service.js';
import { PostsQueryRepository } from '../../infrastucture/query/posts.query-repository.js';
import { PostViewDTO } from './view-dto/post.view-dto.js';

@Controller('posts')
export class PostsController {
  constructor(
    protected readonly postsQueryRepository: PostsQueryRepository,
    protected readonly postsService: PostsService,
  ) {}

  @Get()
  async getAllPosts(@Query() query: GetPostListQueryParams) {
    return await this.postsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return await this.postsQueryRepository.get(id);
  }

  @Post()
  async createPost(@Body() body: CreatePostInputDTO) {
    const post = await this.postsService.create(body);
    return PostViewDTO.mapToView(post);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(@Param('id') id: string, @Body() body: UpdatePostInputDTO) {
    await this.postsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string) {
    return await this.postsService.delete(id);
  }
}

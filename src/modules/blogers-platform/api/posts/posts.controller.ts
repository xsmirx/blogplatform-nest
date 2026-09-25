import {
  Body,
  Controller,
  Delete,
  Get,
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

@Controller('posts')
export class PostsController {
  constructor(
    protected readonly postsQueryRepository: PostsQueryRepository,
    protected readonly postService: PostsService,
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
  async createPost(@Body() body: CreatePostInputDTO) {}

  @Put()
  async updatePost(@Param('id') id: string, @Body() body: UpdatePostInputDTO) {}

  @Delete(':id')
  async deletePost() {}
}

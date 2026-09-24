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
import { GetBlogListQueryParams } from './input-dto/blog-list.input-dto.js';
import { UpdateBlogDto } from './input-dto/update-blog.intut-dto.js';
import { BlogsQueryRepository } from '../../infrastucture/query/blogs.query-repository.js';
import { BlogsService } from '../../application/blogs.service.js';
import { CreateBlogInputDTO } from './input-dto/create-blog.input-dto.js';
import { BlogViewDTO } from './view-dto/blog.view-dto.js';

@Controller('blogs')
export class BlogsController {
  constructor(
    protected readonly blogsQueryRepository: BlogsQueryRepository,
    protected readonly blogsService: BlogsService,
  ) {}

  @Get()
  async getAllBlogs(@Query() query: GetBlogListQueryParams) {
    return await this.blogsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getBlog(@Param('id') id: string) {
    return await this.blogsQueryRepository.get(id);
  }

  @Post()
  async createBlog(@Body() body: CreateBlogInputDTO) {
    const blog = await this.blogsService.create(body);
    return BlogViewDTO.mapToView(blog);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(@Param('id') id: string, @Body() body: UpdateBlogDto) {
    return await this.blogsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string) {
    return await this.blogsService.delete(id);
  }
}

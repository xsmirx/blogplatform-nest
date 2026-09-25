import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreatePostForBlogInputDTO } from './posts/input-dto/create-post.input-dto.js';
import { PostsService } from '../application/posts.service.js';
import { PostViewDTO } from './posts/view-dto/post.view-dto.js';
import { PostsQueryRepository } from '../infrastucture/query/posts.query-repository.js';
import { GetPostListQueryParams } from './posts/input-dto/post-list.input-dto.js';
import { BlogsService } from '../application/blogs.service.js';

@Controller('blogs/:blogId/posts')
export class BlogsPostsController {
  constructor(
    protected readonly postsService: PostsService,
    protected readonly blogsQueryRepository: BlogsService,
    protected readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostListQueryParams,
  ) {
    query.blogId = blogId;
    return await this.postsQueryRepository.getAll(query);
  }

  @Post()
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() body: CreatePostForBlogInputDTO,
  ) {
    const post = await this.postsService.create({ ...body, blogId });
    return PostViewDTO.mapToView(post);
  }
}

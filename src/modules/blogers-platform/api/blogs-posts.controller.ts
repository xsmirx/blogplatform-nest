import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreatePostInputDTO } from './posts/input-dto/create-post.input-dto.js';
import { PostsService } from '../application/posts.service.js';
import { PostViewDTO } from './posts/view-dto/post.view-dto.js';
import { PostsQueryRepository } from '../infrastucture/query/posts.query-repository.js';
import { GetPostListQueryParams } from './posts/input-dto/post-list.input-dto.js';

@Controller('blogs/:blogId/posts')
export class BlogsPostsController {
  constructor(
    protected readonly postsService: PostsService,
    protected readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: Omit<GetPostListQueryParams, 'blogId'>,
  ) {
    return await this.postsQueryRepository.getAll({ ...query, blogId });
  }

  @Post()
  async createPostForBlog(
    @Param('blogId') blogId: string,
    { title, shortDescription, content }: Omit<CreatePostInputDTO, 'blogId'>,
  ) {
    const post = await this.postsService.create({
      blogId,
      title,
      shortDescription,
      content,
    });
    return PostViewDTO.mapToView(post);
  }
}

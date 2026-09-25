import { Controller, Get, Param, Query } from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastucture/query/comments.query-repository.js';
import { GetCommentListQueryParams } from './comments/input-dto/comment-list.input-dto.js';

@Controller('posts/:postId/comments')
export class PostsCommentsController {
  constructor(
    protected readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get()
  async getAllCommentsForPost(
    @Param('postId') postId: string,
    @Query() query: Omit<GetCommentListQueryParams, 'postId'>,
  ) {
    return await this.commentsQueryRepository.getAll({ ...query, postId });
  }
}

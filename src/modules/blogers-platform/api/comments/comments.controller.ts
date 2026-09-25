import { Controller, Get, Param } from '@nestjs/common';
import { CommentsQueryRepository } from '../../infrastucture/query/comments.query-repository.js';

@Controller('comments')
export class CommentsController {
  constructor(
    protected readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return await this.commentsQueryRepository.get(id);
  }
}

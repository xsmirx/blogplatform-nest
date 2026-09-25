import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto.js';
import { Comment, type CommentModel } from '../../domain/comment.model.js';
import { CommentViewDTO } from '../../api/comments/view-dto/comment.view-dto.js';
import { GetCommentListQueryParams } from '../../api/comments/input-dto/comment-list.input-dto.js';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) protected readonly CommentModel: CommentModel,
  ) {}

  public async getAll(
    query: GetCommentListQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    const queryDocument = this.CommentModel.find();

    if (query.postId) {
      queryDocument.where('postId').equals(query.postId);
    }

    const filter = queryDocument.getFilter();

    const comments = await queryDocument
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map(CommentViewDTO.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  public async get(id: string): Promise<CommentViewDTO> {
    const comment = await this.CommentModel.findById(id);
    if (!comment) throw new NotFoundException();
    return CommentViewDTO.mapToView(comment);
  }
}

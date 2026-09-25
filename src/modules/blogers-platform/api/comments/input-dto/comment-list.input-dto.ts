import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto.js';
import { CommentSortBy } from './comment-sort-by.js';

export class GetCommentListQueryParams extends BaseQueryParams {
  sortBy: CommentSortBy = CommentSortBy.CreatedAt;
  postId?: string;
}

import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto.js';
import { PostsSortBy } from './post-sort-by.js';

export class GetPostListQueryParams extends BaseQueryParams {
  sortBy: PostsSortBy = PostsSortBy.CreatedAt;
  blogId?: string;
}

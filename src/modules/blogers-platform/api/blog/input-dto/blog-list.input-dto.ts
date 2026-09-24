import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto.js';
import { BlogsSortBy } from './blogs-sort-by.js';

export class GetBlogListQueryParams extends BaseQueryParams {
  sortBy: BlogsSortBy = BlogsSortBy.CreatedAt;
  searchNameTerm: string | null = null;
}

import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto.js';
import { UsersSortBy } from './users-sort-by.js';

export class GetUserListQueryParams extends BaseQueryParams {
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;
}

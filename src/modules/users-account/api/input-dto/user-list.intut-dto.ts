import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto.js';
import { UsersSortBy } from './users-sort-by.js';

export class GetUserListQueryParams extends BaseQueryParams {
  @IsEnum(UsersSortBy)
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;

  @IsOptional()
  @IsString()
  searchLoginTerm?: string;

  @IsOptional()
  @IsString()
  searchEmailTerm?: string;
}

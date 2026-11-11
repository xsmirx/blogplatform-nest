import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto.js';
import { UsersSortBy } from './users-sort-by.js';
import { Transform } from 'class-transformer';
import { toEnumOrDefault } from '../../../../core/dto/helpers/to-enum-or-default.js';
import { trim } from '../../../../core/dto/helpers/trim.js';

export class GetUserListQueryParams extends BaseQueryParams {
  @Transform(toEnumOrDefault(UsersSortBy, UsersSortBy.CreatedAt))
  @IsEnum(UsersSortBy)
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;

  @Transform(trim)
  @IsOptional()
  @IsString()
  searchLoginTerm?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  searchEmailTerm?: string;
}

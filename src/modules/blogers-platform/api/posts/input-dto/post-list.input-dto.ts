import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto.js';
import { toEnumOrDefault } from '../../../../../core/dto/helpers/to-enum-or-default.js';
import { PostsSortBy } from './post-sort-by.js';

export class GetPostListQueryParams extends BaseQueryParams {
  @Transform(toEnumOrDefault(PostsSortBy, PostsSortBy.CreatedAt))
  @IsEnum(PostsSortBy)
  sortBy: PostsSortBy = PostsSortBy.CreatedAt;

  @IsOptional()
  @IsString()
  blogId?: string;
}

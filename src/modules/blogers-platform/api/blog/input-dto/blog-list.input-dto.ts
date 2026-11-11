import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto.js';
import { toEnumOrDefault } from '../../../../../core/dto/helpers/to-enum-or-default.js';
import { trim } from '../../../../../core/dto/helpers/trim.js';
import { BlogsSortBy } from './blogs-sort-by.js';

export class GetBlogListQueryParams extends BaseQueryParams {
  @Transform(toEnumOrDefault(BlogsSortBy, BlogsSortBy.CreatedAt))
  @IsEnum(BlogsSortBy)
  sortBy: BlogsSortBy = BlogsSortBy.CreatedAt;

  @Transform(trim)
  @IsOptional()
  @IsString()
  searchNameTerm: string | null = null;
}

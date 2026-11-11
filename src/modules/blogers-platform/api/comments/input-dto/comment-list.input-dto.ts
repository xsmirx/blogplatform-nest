import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto.js';
import { toEnumOrDefault } from '../../../../../core/dto/helpers/to-enum-or-default.js';
import { CommentSortBy } from './comment-sort-by.js';

export class GetCommentListQueryParams extends BaseQueryParams {
  @Transform(toEnumOrDefault(CommentSortBy, CommentSortBy.CreatedAt))
  @IsEnum(CommentSortBy)
  sortBy: CommentSortBy = CommentSortBy.CreatedAt;

  @IsOptional()
  @IsString()
  postId?: string;
}

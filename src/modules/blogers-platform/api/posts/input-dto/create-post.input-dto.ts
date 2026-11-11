import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trim } from '../../../../../core/dto/helpers/trim.js';

export class CreatePostForBlogInputDTO {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}

export class CreatePostInputDTO extends CreatePostForBlogInputDTO {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  blogId: string;
}

import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { trim } from '../../../../core/dto/helpers/trim.js';

export class LoginInputDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  loginOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

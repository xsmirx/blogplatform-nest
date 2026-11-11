import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { trim } from '../../../../core/dto/helpers/trim.js';

export class CreateUserInputDto {
  @Transform(trim)
  @IsString()
  @Length(3, 10)
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'login must contain only latin letters, digits, "_" or "-"',
  })
  login: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @Transform(trim)
  @IsEmail()
  email: string;
}

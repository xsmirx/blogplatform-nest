import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { trim } from '../../../../core/dto/helpers/trim.js';

export class NewPasswordInputDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  newPassword: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;
}

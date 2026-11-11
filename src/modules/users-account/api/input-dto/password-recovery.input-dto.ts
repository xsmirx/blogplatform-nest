import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { trim } from '../../../../core/dto/helpers/trim.js';

export class PasswordRecoveryInputDto {
  @Transform(trim)
  @IsEmail()
  email: string;
}

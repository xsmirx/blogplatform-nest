import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { trim } from '../../../../core/dto/helpers/trim.js';

export class RegistrationEmailResendingInputDto {
  @Transform(trim)
  @IsEmail()
  email: string;
}

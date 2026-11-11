import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { trim } from '../../../../core/dto/helpers/trim.js';

export class RegistrationConfirmationInputDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  code: string;
}

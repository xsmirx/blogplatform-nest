import { IsNotEmpty, IsString } from 'class-validator';

export class RegistrationConfirmationInputDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

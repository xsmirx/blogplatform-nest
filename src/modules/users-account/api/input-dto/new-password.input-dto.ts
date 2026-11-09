import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class NewPasswordInputDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  recoveryCode: string;
}

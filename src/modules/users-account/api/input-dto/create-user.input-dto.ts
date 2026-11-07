import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserInputDto {
  @IsString()
  @Length(3, 10)
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'login must contain only latin letters, digits, "_" or "-"',
  })
  login: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsEmail()
  email: string;
}

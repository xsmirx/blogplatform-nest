import { UserDocument } from '../../domain/user.entity.js';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
  firstName: string;
  lastName: string | null;

  static mapToView(user: UserDocument): UserViewDto {
    const dto = new UserViewDto();

    dto.id = user.id;
    dto.email = user.email;
    dto.login = user.login;

    return dto;
  }
}

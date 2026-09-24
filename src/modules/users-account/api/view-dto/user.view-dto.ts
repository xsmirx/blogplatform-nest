import { UserDocument } from '../../domain/user.entity.js';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(user: UserDocument): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.login = user.login;
    dto.createdAt = user.createdAt;
    return dto;
  }
}

import { UserDocument } from '../../domain/user.entity.js';

export class MeViewDto {
  email: string;
  login: string;
  userId: string;

  static mapToView(user: UserDocument) {
    const dto = new MeViewDto();
    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user.id;
    return dto;
  }
}

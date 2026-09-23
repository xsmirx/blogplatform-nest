import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { User, UserDocument, type UserModel } from '../domain/user.entity.js';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModel) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findById(id);
  }

  async delete(id: string) {
    const result = await this.UserModel.findByIdAndDelete(id);
    return result !== null;
  }

  async save(user: UserDocument) {
    await user.save();
  }
}

import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { User, UserDocument, type UserModel } from '../domain/user.entity.js';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModel) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findById(id);
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email });
  }

  async findByLoginOrEmail(loginOrEmail: string) {
    return this.UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });
  }

  async findByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
  }

  async delete(id: string) {
    if (!isValidObjectId(id)) return false;
    const result = await this.UserModel.findByIdAndDelete(id);
    return result !== null;
  }

  async save(user: UserDocument) {
    await user.save();
  }
}

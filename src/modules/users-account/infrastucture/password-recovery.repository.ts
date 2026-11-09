import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PasswordRecovery,
  PasswordRecoveryDocument,
  type PasswordRecoveryModel,
} from '../domain/password-recovery.entity.js';

@Injectable()
export class PasswordRecoveryRepository {
  constructor(
    @InjectModel(PasswordRecovery.name)
    protected readonly passwordRecoveryModel: PasswordRecoveryModel,
  ) {}

  async findByRecoveryCodeHashAndDelete(codeHash: string) {
    return await this.passwordRecoveryModel.findOneAndDelete({
      codeHash,
      expirationDate: { $gt: new Date() },
    });
  }

  async deleteAllByUserId(userId: string) {
    await this.passwordRecoveryModel.deleteMany({ userId });
  }

  async save(passwordRecovery: PasswordRecoveryDocument) {
    await passwordRecovery.save();
  }
}

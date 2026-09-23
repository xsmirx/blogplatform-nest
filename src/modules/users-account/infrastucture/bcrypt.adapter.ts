import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class BcryptAdapter {
  public async generateHash(password: string) {
    return await bcrypt.hash(password, 10);
  }

  public async checkPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}

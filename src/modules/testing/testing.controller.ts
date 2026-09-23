import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { type Connection } from 'mongoose';

@Controller('testing')
export class TestingController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    await this.connection.dropDatabase();
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersAccountModule } from './modules/users-account/users-account.module.js';
import { TestingModule } from './modules/testing/testing.module.js';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://admin:admin@localhost:27017/', {
      dbName: 'blogplatform-nest',
    }),
    UsersAccountModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

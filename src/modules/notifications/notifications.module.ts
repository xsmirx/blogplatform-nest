import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service.js';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: configService.get<string>('EMAIL_ADDRESS'),
            clientId: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            refreshToken: configService.get<string>('GOOGLE_REFRESH_TOKEN'),
          },
        },
        defaults: {
          from: `Blogplatform <${configService.get<string>('EMAIL_ADDRESS')}>`,
        },
      }),
    }),
  ],
  controllers: [],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}

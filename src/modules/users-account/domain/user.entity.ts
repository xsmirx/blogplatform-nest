import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, WithTimestamps } from 'mongoose';
import { DomainException } from '../../../core/exceptions/domain-exception.js';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes.js';

@Schema({ _id: false })
class EmailConfirmation {
  @Prop({ type: Boolean, required: true })
  isConfirmed: boolean;

  @Prop({ type: String, required: true, index: true })
  confirmationCode: string;

  @Prop({ type: Date, required: true })
  expirationDate: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    minLength: 1,
    maxLength: 64,
    required: true,
    unique: true,
  })
  login: string;

  @Prop({
    type: String,
    minLength: 1,
    maxLength: 256,
    required: true,
    unique: true,
    lowercase: true,
  })
  email: string;

  @Prop({ type: String, minLength: 60, maxLength: 60, required: true })
  passwordHash: string;

  @Prop({
    type: EmailConfirmation,
    required: true,
    default: () => ({ isConfirmed: false }) as EmailConfirmation,
  })
  emailConfirmation: EmailConfirmation;

  static createInstance({
    login,
    email,
    passwordHash,
    confirmationCode,
    expirationDate,
  }: {
    login: string;
    email: string;
    passwordHash: string;
    confirmationCode: string;
    expirationDate: Date;
  }) {
    const user = new this();
    user.login = login;
    user.email = email;
    user.passwordHash = passwordHash;
    user.setConfirmationCode(confirmationCode, expirationDate);
    return user as UserDocument;
  }

  public setConfirmationCode(confirmationCode: string, expirationDate: Date) {
    this.emailConfirmation.confirmationCode = confirmationCode;
    this.emailConfirmation.expirationDate = expirationDate;
  }

  public confirmEmail() {
    if (this.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [{ key: 'code', message: 'Code has already been applied' }],
      });
    }
    if (this.emailConfirmation.expirationDate < new Date())
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: [{ key: 'code', message: 'Code is expired' }],
      });

    this.emailConfirmation.isConfirmed = true;
  }

  public setPasswordHash(passwordHash: string) {
    this.passwordHash = passwordHash;
  }
}

export type UserDocument = HydratedDocument<WithTimestamps<User>>;
export type UserModel = Model<UserDocument> & typeof User;

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);

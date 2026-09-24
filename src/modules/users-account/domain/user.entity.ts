import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, WithTimestamps } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ minLength: 1, maxLength: 64, required: true, index: true })
  login: string;

  @Prop({
    type: String,
    minLength: 1,
    maxLength: 256,
    required: true,
    index: true,
  })
  email: string;

  @Prop({ type: String, minLength: 60, maxLength: 60, required: true })
  passwordHash: string;

  static createInstance({
    login,
    email,
    passwordHash,
  }: {
    login: string;
    email: string;
    passwordHash: string;
  }) {
    const user = new this();
    user.login = login;
    user.email = email;
    user.passwordHash = passwordHash;
    return user as UserDocument;
  }
}

export type UserDocument = HydratedDocument<WithTimestamps<User>>;
export type UserModel = Model<UserDocument> & typeof User;

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);

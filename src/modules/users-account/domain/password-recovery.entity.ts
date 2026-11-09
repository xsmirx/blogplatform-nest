import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, {
  HydratedDocument,
  Model,
  Types,
  WithTimestamps,
} from 'mongoose';

@Schema({ timestamps: true })
export class PasswordRecovery {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  codeHash: string;

  @Prop({ type: Date, required: true })
  expirationDate: Date;

  static createInstance({
    userId,
    codeHash,
    expirationDate,
  }: {
    userId: string;
    codeHash: string;
    expirationDate: Date;
  }) {
    const recovery = new this();
    recovery.userId = new Types.ObjectId(userId);
    recovery.codeHash = codeHash;
    recovery.expirationDate = expirationDate;
    return recovery as PasswordRecoveryDocument;
  }
}

export type PasswordRecoveryDocument = HydratedDocument<
  WithTimestamps<PasswordRecovery>
>;
export type PasswordRecoveryModel = Model<PasswordRecoveryDocument> &
  typeof PasswordRecovery;

export const PasswordRecoverySchema =
  SchemaFactory.createForClass(PasswordRecovery);
PasswordRecoverySchema.loadClass(PasswordRecovery);
PasswordRecoverySchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });

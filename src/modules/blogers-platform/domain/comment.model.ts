import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, {
  HydratedDocument,
  Model,
  Types,
  WithTimestamps,
} from 'mongoose';

@Schema({ _id: false })
export class CommentatorInfo {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, minLength: 3, maxLength: 20, required: true })
  userLogin: string;
}

@Schema({ _id: false })
export class LikesInfo {
  likeesCount: number;
  dislikesCount: number;
}

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, minLength: 1, maxLength: 512, required: true })
  content: string;

  @Prop({ type: CommentatorInfo, required: true })
  commentatorInfo: CommentatorInfo;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  postId: Types.ObjectId;

  @Prop({ type: LikesInfo, required: true })
  likesInfo: LikesInfo;

  static createInstance({
    content,
    postId,
    commentatorInfo: { userId, userLogin },
  }: Omit<Comment, 'likesInfo' | 'update'>) {
    const comment = new this();
    comment.content = content;
    comment.postId = new Types.ObjectId(postId);
    comment.commentatorInfo = { userId, userLogin };
    comment.likesInfo = { likeesCount: 0, dislikesCount: 0 };
  }

  public update(comment: Partial<Comment>) {
    this.postId = comment.postId
      ? new Types.ObjectId(comment.postId)
      : this.postId;
    this.content = comment.content || this.content;
    this.commentatorInfo = comment.commentatorInfo || this.commentatorInfo;
    this.likesInfo = comment.likesInfo || this.likesInfo;
  }
}

export type CommentDocument = HydratedDocument<WithTimestamps<Comment>>;
export type CommentModel = Model<CommentDocument> & typeof Comment;

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);

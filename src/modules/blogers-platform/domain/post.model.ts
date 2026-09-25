import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument, Model, Types, WithTimestamps } from 'mongoose';

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, minLength: 1, maxLength: 256, required: true })
  title: string;

  @Prop({ type: String, minLength: 1, maxLength: 512, required: true })
  shortDescription: string;

  @Prop({ type: String, minLength: 1, maxLength: 1024, required: true })
  content: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  blogId: Types.ObjectId;

  @Prop({ type: String, minLength: 1, maxLength: 256, required: true })
  blogName: string;

  static creeateInstance({
    title,
    shortDescription,
    content,
    blogId,
    blogName,
  }: {
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
  }) {
    const post = new this();
    post.title = title;
    post.shortDescription = shortDescription;
    post.content = content;
    post.blogId = new Types.ObjectId(blogId);
    post.blogName = blogName;
    return post as PostDocument;
  }

  public update(blog: Omit<Partial<Post>, 'blogId'> & { blogId: string }) {
    this.title = blog.title || this.title;
    this.shortDescription = blog.shortDescription || this.shortDescription;
    this.content = blog.content || this.content;
    this.blogId = blog.blogId ? new Types.ObjectId(blog.blogId) : this.blogId;
    this.blogName = blog.blogName || this.blogName;
  }
}

export type PostDocument = HydratedDocument<WithTimestamps<Post>>;
export type PostModel = Model<PostDocument> & typeof Post;

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.loadClass(Post);

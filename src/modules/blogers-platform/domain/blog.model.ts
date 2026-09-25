import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, WithTimestamps } from 'mongoose';

@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: String, minLength: 1, maxLength: 256, required: true })
  name: string;

  @Prop({ type: String, minLength: 1, maxLength: 500, required: true })
  description: string;

  @Prop({ type: String, minLength: 1, maxLength: 500, required: true })
  websiteUrl: string;

  @Prop({ type: Boolean, required: true, default: false })
  isMembership: boolean;

  static createInstance({
    name,
    description,
    websiteUrl,
  }: Omit<Blog, 'isMembership' | 'update'>) {
    const blog = new this();
    blog.name = name;
    blog.description = description;
    blog.websiteUrl = websiteUrl;
    blog.isMembership = false;
    return blog as BlogDocument;
  }

  public update(blog: Partial<Blog>) {
    this.name = blog.name || this.name;
    this.description = blog.description || this.description;
    this.websiteUrl = blog.websiteUrl || this.websiteUrl;
  }
}

export type BlogDocument = HydratedDocument<WithTimestamps<Blog>>;
export type BlogModel = Model<BlogDocument> & typeof Blog;

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.loadClass(Blog);

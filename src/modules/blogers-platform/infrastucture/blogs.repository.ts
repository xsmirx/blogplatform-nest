import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, type BlogModel } from '../domain/blog.model.js';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blog.name) protected readonly BlogModel: BlogModel,
  ) {}

  public async findById(id: string) {
    return await this.BlogModel.findById(id);
  }

  public async save(blog: BlogDocument) {
    return await blog.save();
  }

  public async delete(id: string) {
    return await this.BlogModel.findByIdAndDelete(id);
  }
}

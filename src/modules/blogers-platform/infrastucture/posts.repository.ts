import { Injectable, NotFoundException } from '@nestjs/common';
import { Post, PostDocument, type PostModel } from '../domain/post.model.js';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) protected readonly PostModel: PostModel,
  ) {}

  public async findById(id: string) {
    return await this.PostModel.findById(id);
  }

  public async save(post: PostDocument) {
    await post.save();
  }

  public async delete(id: string) {
    const result = await this.PostModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException();
  }
}

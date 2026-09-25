import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../infrastucture/posts.repository.js';
import { InjectModel } from '@nestjs/mongoose';
import { Post, type PostModel } from '../domain/post.model.js';
import { CreatePostInputDTO } from '../api/posts/input-dto/create-post.input-dto.js';
import { BlogsRepository } from '../infrastucture/blogs.repository.js';
import { UpdatePostInputDTO } from '../api/posts/input-dto/update-post.input-dto.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) protected readonly PostModel: PostModel,
    protected readonly postsRepository: PostsRepository,
    protected readonly blogsRepository: BlogsRepository,
  ) {}

  public async create({
    title,
    shortDescription,
    content,
    blogId,
  }: CreatePostInputDTO) {
    const blog = await this.blogsRepository.findById(blogId);
    if (!blog) throw new NotFoundException();
    const post = this.PostModel.creeateInstance({
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
    });
    await this.postsRepository.save(post);
    return post;
  }

  public async update(
    id: string,
    { title, shortDescription, content, blogId }: UpdatePostInputDTO,
  ) {
    const post = await this.postsRepository.findById(id);
    if (!post) throw new NotFoundException();
    const blog = await this.blogsRepository.findById(blogId);
    if (!blog) throw new NotFoundException();
    post.update({
      title,
      shortDescription,
      content,
      blogId: blog.id,
      blogName: blog.name,
    });
    await this.postsRepository.save(post);
  }

  public async delete(id: string) {
    await this.postsRepository.delete(id);
  }
}

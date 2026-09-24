import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlogInputDTO } from '../api/blog/input-dto/create-blog.input-dto.js';
import { UpdateBlogDto } from '../api/blog/input-dto/update-blog.intut-dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, type BlogModel } from '../domain/blog.model.js';
import { BlogsRepository } from '../infrastucture/blogs.repository.js';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) protected readonly BlogModel: BlogModel,
    protected readonly blogsRepository: BlogsRepository,
  ) {}

  public async create({ name, description, websiteUrl }: CreateBlogInputDTO) {
    const blog = this.BlogModel.createInstance({
      name,
      description,
      websiteUrl,
    });
    await this.blogsRepository.save(blog);
    return blog;
  }

  public async update(
    id: string,
    { name, description, websiteUrl }: UpdateBlogDto,
  ) {
    const blog = await this.blogsRepository.findById(id);
    if (!blog) throw new NotFoundException();
    blog.update({ name, description, websiteUrl });
    await this.blogsRepository.save(blog);
  }

  public async delete(id: string) {
    const result = await this.blogsRepository.delete(id);
    if (!result) throw new NotFoundException();
  }
}

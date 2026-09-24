import { Module } from '@nestjs/common';
import { BlogsController } from './api/blog/blogs.controller.js';
import { BlogsQueryRepository } from './infrastucture/query/blogs.query-repository.js';
import { BlogsService } from './application/blogs.service.js';
import { BlogsRepository } from './infrastucture/blogs.repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.model.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogsController],
  providers: [BlogsQueryRepository, BlogsService, BlogsRepository],
})
export class BlogersPlatformModule {}

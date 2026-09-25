import { Module } from '@nestjs/common';
import { BlogsController } from './api/blog/blogs.controller.js';
import { BlogsQueryRepository } from './infrastucture/query/blogs.query-repository.js';
import { BlogsService } from './application/blogs.service.js';
import { BlogsRepository } from './infrastucture/blogs.repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.model.js';
import { PostsController } from './api/posts/posts.controller.js';
import { PostsService } from './application/posts.service.js';
import { PostsQueryRepository } from './infrastucture/query/posts.query-repository.js';
import { PostsRepository } from './infrastucture/posts.repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogsController, PostsController],
  providers: [
    BlogsQueryRepository,
    BlogsService,
    BlogsRepository,
    PostsQueryRepository,
    PostsService,
    PostsRepository,
  ],
})
export class BlogersPlatformModule {}

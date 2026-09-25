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
import { BlogsPostsController } from './api/blogs-posts.controller.js';
import { Post, PostSchema } from './domain/post.model.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  controllers: [BlogsController, PostsController, BlogsPostsController],
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

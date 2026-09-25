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
import { CommentsController } from './api/comments/comments.controller.js';
import { PostsCommentsController } from './api/posts-comments.controller.js';
import { Comment, CommentSchema } from './domain/comment.model.js';
import { CommentsQueryRepository } from './infrastucture/query/comments.query-repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  controllers: [
    BlogsController,
    PostsController,
    BlogsPostsController,
    CommentsController,
    PostsCommentsController,
  ],
  providers: [
    BlogsQueryRepository,
    BlogsService,
    BlogsRepository,
    PostsQueryRepository,
    PostsService,
    PostsRepository,
    CommentsQueryRepository,
  ],
})
export class BlogersPlatformModule {}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, type PostModel } from '../../domain/post.model.js';
import { GetPostListQueryParams } from '../../api/posts/input-dto/post-list.input-dto.js';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto.js';
import { PostViewDTO } from '../../api/posts/view-dto/post.view-dto.js';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) protected readonly PostModel: PostModel,
  ) {}

  public async getAll(
    query: GetPostListQueryParams,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    const queryDocument = this.PostModel.find();

    const filter = queryDocument.getFilter();

    const posts = await queryDocument
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map((post) => PostViewDTO.mapToView(post));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  public async get(id: string): Promise<PostViewDTO> {
    const post = await this.PostModel.findById(id);
    if (!post) throw new NotFoundException();
    return PostViewDTO.mapToView(post);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { GetBlogListQueryParams } from '../../api/blog/input-dto/blog-list.input-dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, type BlogModel } from '../../domain/blog.model.js';
import { BlogViewDTO } from '../../api/blog/view-dto/blog.view-dto.js';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto.js';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name) protected readonly BlogModel: BlogModel,
  ) {}

  public async getAll(
    query: GetBlogListQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDTO[]>> {
    const queryDocument = this.BlogModel.find();

    if (query.searchNameTerm) {
      queryDocument.where('name').regex(new RegExp(query.searchNameTerm, 'i'));
    }

    const filter = queryDocument.getFilter();

    const blogs = await queryDocument
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.BlogModel.countDocuments(filter);

    const items = blogs.map(BlogViewDTO.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  public async get(id: string): Promise<BlogViewDTO> {
    const blog = await this.BlogModel.findById(id);
    if (!blog) throw new NotFoundException();
    return BlogViewDTO.mapToView(blog);
  }
}

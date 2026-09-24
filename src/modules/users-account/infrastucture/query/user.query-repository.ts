import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, type UserModel } from '../../domain/user.entity.js';
import { GetUserListQueryParams } from '../../api/input-dto/user-list.intut-dto.js';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto.js';
import { UserViewDto } from '../../api/view-dto/user.view-dto.js';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectModel(User.name) protected readonly UserModel: UserModel,
  ) {}

  public async findAll(
    query: GetUserListQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const queryDocument = this.UserModel.find();
    if (query.searchLoginTerm) {
      queryDocument.or([
        this.UserModel.where('login')
          .regex(new RegExp(query.searchLoginTerm, 'i'))
          .getFilter(),
      ]);
    }
    if (query.searchEmailTerm) {
      queryDocument.or([
        this.UserModel.where('eemail')
          .regex(new RegExp(query.searchEmailTerm, 'i'))
          .getFilter(),
      ]);
    }
    const filter = queryDocument.getFilter();

    const users = await queryDocument
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.UserModel.countDocuments(filter);

    const items = users.map(UserViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

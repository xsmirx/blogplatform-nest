import { CommentDocument } from '../../../domain/comment.model.js';

export class CommentViewDTO {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: 'None' | 'Like' | 'Dislike';
  };

  static mapToView(blog: CommentDocument) {
    const dto = new CommentViewDTO();
    dto.id = blog.id;
    dto.content = blog.content;
    dto.commentatorInfo.userId = blog.commentatorInfo.userId.toString();
    dto.commentatorInfo.userLogin = blog.commentatorInfo.userLogin;
    dto.createdAt = blog.createdAt.toISOString();
    dto.likesInfo.likesCount = blog.likesInfo.likeesCount;
    dto.likesInfo.dislikesCount = blog.likesInfo.dislikesCount;
    dto.likesInfo.myStatus = 'None';
    return dto;
  }
}

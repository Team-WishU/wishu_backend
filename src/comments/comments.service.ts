import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../products/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
  ) {}

  // 회원 탈퇴 시 해당 유저가 작성한 댓글 삭제
  async deleteByUser(userId: string): Promise<void> {
    await this.commentModel.deleteMany({ author: userId });
  }
}

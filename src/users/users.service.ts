import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './create-user.dto';
import { User, UserDocument } from './users.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from '../email-verification/email-verification.schema';
import { ProductsService } from '../products/products.service';
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(EmailVerification.name)
    private readonly evModel: Model<EmailVerificationDocument>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => CommentsService))
    private readonly commentsService: CommentsService,
  ) {}

  /**
   * 회원가입: 이메일 인증 확인 → 중복 확인 → 저장 → 인증 레코드 삭제
   */
  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, nickname, password } = createUserDto;

    const verified = await this.evModel.exists({ email });
    if (!verified) {
      throw new BadRequestException('이메일 인증이 필요합니다.');
    }

    const existing = await this.userModel.findOne({
      $or: [{ email }, { nickname }],
    });
    if (existing) {
      throw new BadRequestException('이미 사용 중인 이메일 또는 닉네임입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      isEmailVerified: true,
    });
    const saved = await user.save();

    await this.evModel.deleteMany({ email });

    return saved;
  }

  /** 닉네임 중복 체크 */
  async checkNickname(nickname: string): Promise<{ isAvailable: boolean }> {
    const exists = await this.userModel.exists({ nickname });
    return { isAvailable: !exists };
  }

  /** 프로필 조회 (비밀번호 제외) */
  async findById(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  /** 프로필 수정 (닉네임, 프로필 이미지만 가능) */
  async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'nickname' | 'profileImage'>>,
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, updates, {
      new: true,
      select: '-password',
    });
  }

  /** 회원 탈퇴 */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    await this.commentsService.deleteByUser(userId); // 댓글 삭제
    await this.productsService.deleteByOwner(user.nickname); // 상품 삭제
    await this.productsService.deleteCommentsByNickname(user.nickname); // 댓글 제거 추가
    await this.userModel.findByIdAndDelete(userId); // 유저 삭제
  }
}

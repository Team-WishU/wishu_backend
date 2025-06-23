import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './create-user.dto';
import { User, UserDocument } from './users.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from '../email-verification/email-verification.schema';
import { ProductsService } from '../products/products.service';
import { SharedBucketService } from '../shared-bucket/shared-bucket.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(EmailVerification.name)
    private readonly evModel: Model<EmailVerificationDocument>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => SharedBucketService))
    private readonly sharedBucketService: SharedBucketService,
  ) {}

  async findUsersByIds(
    userIds: string[],
  ): Promise<{ _id: string; nickname: string; profileImage: string }[]> {
    if (!userIds || userIds.length === 0) return [];
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('_id nickname profileImage')
      .lean();

    return users.map((user) => ({
      _id:
        typeof user._id === 'string'
          ? user._id
          : (user._id as Types.ObjectId).toHexString(),
      nickname: user.nickname || 'unknown',
      profileImage: user.profileImage || 'default.png',
    }));
  }

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

  async checkNickname(nickname: string): Promise<{ isAvailable: boolean }> {
    const exists = await this.userModel.exists({ nickname });
    return { isAvailable: !exists };
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async findByNickname(nickname: string): Promise<User> {
    const user = await this.userModel.findOne({ nickname }).select('-password');
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

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
    // 1. 내가 올린 상품 모두 삭제
    await this.productsService.deleteByOwner(userId);

    // 2. 내가 남의 상품에 단 댓글 모두 삭제
    await this.productsService.deleteCommentsByUserId(userId);

    // 3. 모든 상품의 savedBy에서 내 userId 제거 (찜기록에서 삭제)
    await this.productsService.deleteSavedByUser(userId);

    // 4. 내가 포함된 모든 공유 위시버킷 삭제
    await this.sharedBucketService.deleteBucketsByUser(userId);

    // 5. 모든 유저에서 friends/요청 목록에서 내 userId 제거
    await this.userModel.updateMany(
      {},
      {
        $pull: {
          friends: userId,
          'friendRequests.incoming': userId,
          'friendRequests.outgoing': userId,
        },
      },
    );

    // 6. 내 유저 정보 삭제
    await this.userModel.findByIdAndDelete(userId);
  }
}

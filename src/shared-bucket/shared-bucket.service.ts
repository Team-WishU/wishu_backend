import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SharedBucket, SharedBucketDocument } from './shared-bucket.schema';
import { Product, ProductDocument } from '../products/products.schema';
import { UsersService } from '../users/users.service';

export interface UserPayload {
  _id: string;
  nickname: string;
  profileImage: string;
}

@Injectable()
export class SharedBucketService {
  constructor(
    @InjectModel(SharedBucket.name)
    private sharedBucketModel: Model<SharedBucketDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  private toObjectId(id: string) {
    if (!id) return null;
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
  }

  // 내 userId가 포함된 모든 공유 버킷 + 상품
  async findBucketsByUserId(userId: string) {
    const objUserId = this.toObjectId(userId);
    if (!objUserId)
      throw new UnauthorizedException('유효하지 않은 사용자 ID입니다.');

    const buckets = await this.sharedBucketModel
      .find({ userIds: objUserId })
      .lean();

    const bucketsWithItems = await Promise.all(
      buckets.map(async (bucket) => {
        const collaboratorIds = (bucket.userIds ?? [])
          .map((id) =>
            typeof id === 'string' ? id : (id as Types.ObjectId)?.toString(),
          )
          .filter(Boolean);

        const collaborators =
          await this.usersService.findUsersByIds(collaboratorIds);

        const products = await this.productModel
          .find({ 'uploadedBy._id': { $in: collaboratorIds } })
          .sort({ createdAt: -1 })
          .lean();

        const itemsByUserId: Record<string, any[]> = {};
        for (const p of products) {
          const uid = String(p.uploadedBy?._id || 'unknown');
          if (!itemsByUserId[uid]) itemsByUserId[uid] = [];
          itemsByUserId[uid].push(p);
        }

        return {
          ...bucket,
          collaborators,
          items: products,
          itemsByUserId,
        };
      }),
    );

    return { buckets: bucketsWithItems };
  }

  // 버킷이 없으면 생성, 있으면 반환 (참여자 정보도 포함)
  async getOrCreateSharedBucket(userId1: string, userId2: string) {
    const objId1 = this.toObjectId(userId1);
    const objId2 = this.toObjectId(userId2);

    if (!objId1 || !objId2)
      throw new UnauthorizedException('유효하지 않은 사용자 ID입니다.');

    let bucket = await this.sharedBucketModel.findOne({
      userIds: { $all: [objId1, objId2] },
    });

    if (!bucket) {
      bucket = await this.sharedBucketModel.create({
        userIds: [objId1, objId2],
        comments: [],
      });
    }

    const collaborators = await this.usersService.findUsersByIds([
      userId1,
      userId2,
    ]);
    return { ...bucket.toObject(), collaborators };
  }

  // 특정 두 유저의 모든 상품, 참여자 정보 반환
  async getSharedWishlist(userId1: string, userId2: string) {
    const objId1 = this.toObjectId(userId1);
    const objId2 = this.toObjectId(userId2);

    if (!objId1 || !objId2)
      throw new UnauthorizedException('유효하지 않은 사용자 ID입니다.');

    const users = await this.usersService.findUsersByIds([userId1, userId2]);
    const products = await this.productModel
      .find({ 'uploadedBy._id': { $in: [userId1, userId2] } })
      .sort({ createdAt: -1 })
      .lean();

    return { items: products, collaborators: users };
  }

  // 공유 버킷에 댓글 추가
  async addComment(bucketId: string, user: UserPayload, text: string) {
    const comment = {
      userId: user._id,
      nickname: user.nickname,
      profileImage: user.profileImage,
      text,
      createdAt: new Date(),
    };
    return this.sharedBucketModel.findByIdAndUpdate(
      bucketId,
      { $push: { comments: comment } },
      { new: true },
    );
  }

  // 공유 버킷의 댓글 목록 가져오기
  async getComments(bucketId: string) {
    const bucket = await this.sharedBucketModel.findById(bucketId);
    return bucket?.comments || [];
  }

  // 특정 두 유저의 공유 버킷 삭제
  async deleteBucketsByUserPair(userId1: string, userId2: string) {
    const objId1 = this.toObjectId(userId1);
    const objId2 = this.toObjectId(userId2);

    if (!objId1 || !objId2)
      throw new UnauthorizedException('유효하지 않은 사용자 ID입니다.');

    await this.sharedBucketModel.deleteMany({
      userIds: { $all: [objId1, objId2] },
    });
  }

  async deleteBucketsByUser(userId: string): Promise<void> {
    await this.sharedBucketModel.deleteMany({ userIds: userId });
  }
}

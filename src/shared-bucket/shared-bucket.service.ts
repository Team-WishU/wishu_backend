import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import mongoose from 'mongoose';
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
    private usersService: UsersService,
  ) {}

  async findBucketsByUserId(userId: string) {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const users = await this.usersService.findUsersByIds([userId]);
    const myNickname = users[0]?.nickname;
    if (!myNickname) throw new Error('닉네임 없음');

    const buckets = await this.sharedBucketModel
      .find({ userIds: objectUserId })
      .lean();

    const bucketsWithItems = await Promise.all(
      buckets.map(async (bucket) => {
        const userIdStrings: string[] = Array.isArray(bucket.userIds)
          ? bucket.userIds.map((id) =>
              typeof id === 'string'
                ? id
                : (id as Types.ObjectId).toHexString(),
            )
          : [];

        const collaborators =
          await this.usersService.findUsersByIds(userIdStrings);
        const nicknames = collaborators.map((u) => u.nickname);

        const products = await this.productModel
          .find({ 'uploadedBy.nickname': { $in: nicknames } })
          .lean();

        const itemsByNickname: Record<string, any[]> = {};
        for (const p of products) {
          const nickname = p.uploadedBy?.nickname || 'unknown';
          if (!itemsByNickname[nickname]) itemsByNickname[nickname] = [];
          itemsByNickname[nickname].push(p);
        }

        return {
          ...bucket,
          collaborators,
          items: products,
          itemsByNickname,
        };
      }),
    );
    return { buckets: bucketsWithItems };
  }

  async getOrCreateSharedBucket(userId1: string, userId2: string) {
    const objUserId1 = new mongoose.Types.ObjectId(userId1);
    const objUserId2 = new mongoose.Types.ObjectId(userId2);

    let bucket = await this.sharedBucketModel.findOne({
      userIds: { $all: [objUserId1, objUserId2] },
    });

    if (!bucket) {
      bucket = await this.sharedBucketModel.create({
        userIds: [objUserId1, objUserId2],
        comments: [],
      });
    }

    const collaborators = await this.usersService.findUsersByIds([
      userId1,
      userId2,
    ]);
    return { ...bucket.toObject(), collaborators };
  }

  async getSharedWishlist(userId1: string, userId2: string) {
    const users = await this.usersService.findUsersByIds([userId1, userId2]);
    const nicknames = users.map((u) => u.nickname);

    const products = await this.productModel
      .find({ 'uploadedBy.nickname': { $in: nicknames } })
      .lean();

    return { items: products, collaborators: users };
  }

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

  async getComments(bucketId: string) {
    const bucket = await this.sharedBucketModel.findById(bucketId);
    return bucket?.comments || [];
  }

  async deleteBucketsByUserPair(userId1: string, userId2: string) {
    await this.sharedBucketModel.deleteMany({
      userIds: { $all: [userId1, userId2] },
    });
  }
}

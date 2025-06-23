import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/users.schema';
import { Model, Types } from 'mongoose';
import { SharedBucketService } from '../shared-bucket/shared-bucket.service';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => SharedBucketService))
    private readonly sharedBucketService: SharedBucketService,
  ) {}

  // 친구 요청 보내기
  async sendRequest(fromId: string, toId: string) {
    if (fromId === toId)
      throw new BadRequestException('자기 자신에게 요청 불가');
    const from = await this.userModel.findById(fromId);
    const to = await this.userModel.findById(toId);

    if (!from || !to) throw new NotFoundException('사용자 없음');

    if (from.friends.some((id) => id.equals(toId)))
      throw new BadRequestException('이미 친구');
    if (
      from.friendRequests.outgoing.some((id) => id.equals(toId)) ||
      to.friendRequests.incoming.some((id) => id.equals(fromId))
    )
      throw new BadRequestException('이미 요청 보냄');

    from.friendRequests.outgoing.push(new Types.ObjectId(toId));
    to.friendRequests.incoming.push(new Types.ObjectId(fromId));
    await from.save();
    await to.save();
    return { success: true };
  }

  // 친구 요청 수락
  async acceptRequest(meId: string, fromId: string) {
    const me = await this.userModel.findById(meId);
    const from = await this.userModel.findById(fromId);

    if (!me || !from) throw new NotFoundException('사용자 없음');

    if (!me.friendRequests.incoming.some((id) => id.equals(fromId)))
      throw new BadRequestException('요청이 없음');

    // 친구 등록 (쌍방)
    me.friends.push(new Types.ObjectId(fromId));
    from.friends.push(new Types.ObjectId(meId));

    // 요청 삭제
    me.friendRequests.incoming = me.friendRequests.incoming.filter(
      (id) => !id.equals(fromId),
    );
    from.friendRequests.outgoing = from.friendRequests.outgoing.filter(
      (id) => !id.equals(meId),
    );
    await me.save();
    await from.save();
    return { success: true };
  }

  // 친구 삭제 (공유 위시템도 같이 삭제)
  async removeFriend(meId: string, friendId: string) {
    const me = await this.userModel.findById(meId);
    const friend = await this.userModel.findById(friendId);

    if (!me || !friend) throw new NotFoundException('사용자 없음');

    me.friends = me.friends.filter((id) => !id.equals(friendId));
    friend.friends = friend.friends.filter((id) => !id.equals(meId));
    await me.save();
    await friend.save();

    // 공유 위시리스트도 같이 삭제
    await this.sharedBucketService.deleteBucketsByUserPair(meId, friendId);

    return { success: true };
  }

  // 내 친구 목록
  async getFriends(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('friends', 'nickname profileImage');
    return user?.friends || [];
  }

  // 친구요청(incoming/outgoing) 목록
  async getFriendRequests(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('friendRequests.incoming', 'nickname profileImage')
      .populate('friendRequests.outgoing', 'nickname profileImage');
    return {
      incoming: user?.friendRequests?.incoming || [],
      outgoing: user?.friendRequests?.outgoing || [],
    };
  }
}

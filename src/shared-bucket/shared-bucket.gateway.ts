import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SharedBucketService } from './shared-bucket.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({ cors: true })
export class SharedBucketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly sharedBucketService: SharedBucketService,
    private readonly usersService: UsersService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { bucketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.bucketId) return;
    client.join(data.bucketId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { bucketId: string; userId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.bucketId || !data.userId || !data.text?.trim()) return;

    // ✅ 직접 userModel로 쿼리(plain object로 받기)
    const user = await this.usersService['userModel']
      .findById(data.userId)
      .select('_id nickname profileImage')
      .lean();

    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const _id = typeof user._id === 'string' ? user._id : user._id.toString();

    const commentUser = {
      _id,
      nickname: user.nickname,
      profileImage: user.profileImage,
    };

    await this.sharedBucketService.addComment(
      data.bucketId,
      commentUser,
      data.text,
    );

    const msgPayload = {
      userId: _id,
      nickname: user.nickname,
      profileImage: user.profileImage,
      text: data.text,
      createdAt: new Date(),
    };
    client.to(data.bucketId).emit('newMessage', msgPayload);
    client.emit('newMessage', msgPayload);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { bucketId: string; user: { nickname: string } },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.bucketId || !data.user?.nickname) return;
    client
      .to(data.bucketId)
      .emit('showTyping', { nickname: data.user.nickname });
  }
}

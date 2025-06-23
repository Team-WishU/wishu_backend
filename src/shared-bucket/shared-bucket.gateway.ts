import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SharedBucketService } from './shared-bucket.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({ cors: true })
export class SharedBucketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

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

    const room = this.server.sockets.adapter.rooms.get(data.bucketId);
    const numClients = room ? room.size : 0;

    console.log(`✅ ${client.id} joined room ${data.bucketId}`);
    console.log(`👥 현재 방 인원 수: ${numClients}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { bucketId: string; userId: string; text: string },
  ) {
    if (!data.bucketId || !data.userId || !data.text?.trim()) return;

    // 👇 명시적 타입 반환 (lean 사용으로 plain object)
    const user = await this.usersService['userModel']
      .findById(data.userId)
      .select('_id nickname profileImage')
      .lean();

    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const _id = typeof user._id === 'string' ? user._id : String(user._id); // 명시적 string 변환

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

    // ✅ 현재 방의 모든 사용자에게 메시지 전송
    this.server.to(data.bucketId).emit('newMessage', msgPayload);
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

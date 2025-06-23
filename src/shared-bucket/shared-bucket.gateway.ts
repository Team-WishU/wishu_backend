import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SharedBucketService, UserPayload } from './shared-bucket.service';

@WebSocketGateway({ cors: true })
export class SharedBucketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly sharedBucketService: SharedBucketService) {}

  // 클라이언트 연결 시
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // 클라이언트 연결 해제 시
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // 방 입장 (옵션)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { bucketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.bucketId);
    // (필요하면 전체 유저에게 알림도 가능)
  }

  // 채팅 메시지 전송(댓글도 가능)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { bucketId: string; user: UserPayload; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    // DB 저장 (댓글과 동일)
    const result = await this.sharedBucketService.addComment(
      data.bucketId,
      data.user,
      data.text,
    );
    // 같은 버킷의 모든 유저에게 메시지 전송
    client.to(data.bucketId).emit('newMessage', {
      user: data.user,
      text: data.text,
      createdAt: new Date(),
    });
    // 자기 자신도 메시지 수신
    client.emit('newMessage', {
      user: data.user,
      text: data.text,
      createdAt: new Date(),
    });
    return result;
  }
  // shared-bucket.gateway.ts

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { bucketId: string; user: { nickname: string } },
    @ConnectedSocket() client: Socket,
  ) {
    // 같은 방의 다른 유저에게만 보냄 (본인은 제외)
    client
      .to(data.bucketId)
      .emit('showTyping', { nickname: data.user.nickname });
  }
}

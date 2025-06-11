import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 임시 인증된 유저 정보 주입 (실제 JWT 인증 미들웨어로 대체 필요)
    request.user = {
      nickname: '빨간사과',
      profileImage: 'https://cdn.wishu.com/profile/redapple.png',
    };

    return true;
  }
}

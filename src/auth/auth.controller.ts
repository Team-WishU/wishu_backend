import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

interface UserPayload {
  _id: string;
  email?: string;
  nickname?: string;
  profileImage?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<any> {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('withdraw')
  async withdraw(@Req() req: Request): Promise<{ message: string }> {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) {
      throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    }
    await this.authService.withdraw(user._id);
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }
}

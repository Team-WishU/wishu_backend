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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<any> {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('withdraw')
  async withdraw(@Req() req: any): Promise<{ message: string }> {
    console.log('🔥 withdraw endpoint hit');
    console.log('✅ req.user:', req.user); // << 요거 추가

    const userId = req.user.userId || req.user.sub;
    if (!userId) throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');

    await this.authService.withdraw(userId);
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }
}

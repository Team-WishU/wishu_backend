// src/email-verification/email-verification.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';

@Controller('email-verification')
export class EmailVerificationController {
  constructor(private readonly emailService: EmailVerificationService) {}

  @Post('request')
  async requestCode(@Body('email') email: string) {
    await this.emailService.sendVerificationCode(email);
    return { message: '인증 코드 전송됨' };
  }

  @Post('verify')
  async verify(@Body() body: { email: string; code: string }) {
    const success = await this.emailService.verifyCode(body.email, body.code);

    if (!success) {
      throw new BadRequestException('인증번호가 올바르지 않습니다.');
    }

    return { success: true };
  }
}

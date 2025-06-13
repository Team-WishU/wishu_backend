import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import {
  EmailVerification,
  EmailVerificationDocument,
} from './email-verification.schema';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectModel(EmailVerification.name)
    private evModel: Model<EmailVerificationDocument>,
    private configService: ConfigService,
  ) {}

  /** 1) 코드 생성 → 저장 → 이메일 전송 */
  async sendVerificationCode(email: string): Promise<void> {
    const existing = await this.evModel.findOne({ email });

    // 이미 유효한 인증 코드가 있으면 새로 만들지 않음
    if (existing && existing.expiresAt > new Date()) {
      console.log(`⚠️ 이미 유효한 인증 코드 존재 → ${email}`);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5);

    await this.evModel.deleteMany({ email });
    await this.evModel.create({ email, code, expiresAt });

    await this.sendEmail(email, code);
  }

  /** 2) 검증만 수행 (삭제는 회원가입 시점으로 이동) */
  async verifyCode(email: string, code: string): Promise<boolean> {
    const record = await this.evModel.findOne({ email, code });
    if (!record || record.expiresAt < new Date()) return false;
    return true;
  }

  /** 실제 발송 로직 (Gmail SMTP) */
  private async sendEmail(to: string, code: string): Promise<void> {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const fromName =
      this.configService.get<string>('EMAIL_FROM_NAME') ?? 'WishU 인증';

    const transporter: Transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from: `"${fromName}" <${user}>`,
        to,
        subject: '[WishU] 이메일 인증코드',
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; padding: 20px;">
            <h2 style="color: #444;">WishU 이메일 인증</h2>
            <p>인증 코드: <strong style="color: #007bff;">${code}</strong></p>
            <p>이 코드는 5분 동안 유효합니다.</p>
            <hr /><small style="color: gray;">본 메일은 발신 전용입니다.</small>
          </div>
        `,
      });
      console.log(`✅ 이메일 전송 성공 → ${to}`);
    } catch (err) {
      console.error('❌ 이메일 전송 실패:', (err as Error).message);
    }
  }
}

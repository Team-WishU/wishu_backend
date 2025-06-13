// users.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './create-user.dto';
import { User, UserDocument } from './users.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from '../email-verification/email-verification.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(EmailVerification.name)
    private evModel: Model<EmailVerificationDocument>,
  ) {}

  /** 회원가입: 인증확인 → 중복확인 → 저장 → 인증 레코드 삭제 */
  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, nickname, password } = createUserDto;

    // 1) 이메일 인증 여부 확인
    const verified = await this.evModel.exists({ email });
    if (!verified) {
      throw new BadRequestException('이메일 인증이 필요합니다.');
    }

    // 2) 중복 이메일 또는 닉네임 확인
    const existing = await this.userModel.findOne({
      $or: [{ email }, { nickname }],
    });
    if (existing) {
      throw new BadRequestException('이미 사용 중인 이메일 또는 닉네임입니다.');
    }

    // 3) 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4) 사용자 생성
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      isEmailVerified: true,
    });
    const saved = await user.save();

    // 5) 인증 레코드 삭제
    await this.evModel.deleteMany({ email });

    return saved;
  }

  /** 닉네임 중복 체크 */
  async checkNickname(nickname: string): Promise<{ isAvailable: boolean }> {
    const exists = await this.userModel.exists({ nickname });
    return { isAvailable: !exists };
  }

  /** 프로필 조회 (password 제외) */
  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).select('-password');
  }

  /** 프로필 수정 (닉네임, 프로필 이미지만 가능) */
  async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'nickname' | 'profileImage'>>,
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, updates, {
      new: true,
      select: '-password',
    });
  }
}

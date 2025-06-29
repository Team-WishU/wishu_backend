import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

interface UserDocument {
  _id: Types.ObjectId;
  email: string;
  password: string;
  nickname: string;
  profileImage: string;
  name: string;
  birthDate: Date;
  gender: 'male' | 'female';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  // 회원 탈퇴 로직
  async withdraw(userId: string): Promise<void> {
    await this.usersService.deleteUser(userId);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      _id: string;
      email: string;
      nickname: string;
      profileImage: string;
      name: string;
      birthDate: string;
      gender: string;
    };
  }> {
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const payload = {
      sub: user._id.toString(), // JWT 표준 sub 필드
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
        name: user.name,
        birthDate: user.birthDate.toISOString().split('T')[0],
        gender: user.gender,
      },
    };
  }
}

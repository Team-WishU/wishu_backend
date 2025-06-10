// src/users/users.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async registerUser(data: {
    email: string;
    password: string;
    name: string;
    birthYear: number;
    gender: string;
  }) {
    const { email, password, name, birthYear, gender } = data;

    // 중복 검사
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new this.userModel({
      email,
      password: hashedPassword,
      name,
      birthYear,
      gender,
    });

    await createdUser.save();
    return { success: true, message: '회원가입 완료' };
  }
}

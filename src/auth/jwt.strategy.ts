import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET_KEY') as string,
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    nickname: string;
    profileImage: string;
  }) {
    return {
      _id: payload.sub,
      email: payload.email,
      nickname: payload.nickname,
      profileImage: payload.profileImage,
    };
  }
}

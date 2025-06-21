import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  birthDate: Date;

  @Prop({ required: true })
  gender: 'male' | 'female';

  @Prop({ required: true, unique: true })
  nickname: string;

  @Prop({
    required: true,
    enum: [
      'chicken.png',
      'cow.png',
      'dog.png',
      'dragon.png',
      'horse.png',
      'monkey.png',
      'mouse.png',
      'pig.png',
      'rabbit.png',
      'sheep.png',
      'snake.png',
      'tiger.png',
    ],
  })
  profileImage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

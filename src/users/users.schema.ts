// src/users/users.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // createdAt, updatedAt 자동 추가됨
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  birthYear: number;

  @Prop({ required: true })
  gender: string;

  @Prop()
  nickname?: string;

  @Prop()
  profileImage?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

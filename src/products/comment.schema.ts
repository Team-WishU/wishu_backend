import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommentDocument = Comment & Document;
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Comment {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  nickname: string;

  @Prop({ required: true })
  profileImage: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

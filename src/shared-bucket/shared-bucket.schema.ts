import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SharedBucketDocument = SharedBucket & Document;

@Schema({ timestamps: true })
export class SharedBucket {
  @Prop({ required: true, type: [String] })
  userIds: string[];

  @Prop({ type: [Object], default: [] })
  comments: {
    userId: string;
    nickname: string;
    profileImage: string;
    text: string;
    createdAt: Date;
  }[];
}

export const SharedBucketSchema = SchemaFactory.createForClass(SharedBucket);

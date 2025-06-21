import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  productUrl: string;

  @Prop({
    type: {
      nickname: String,
      profileImage: String,
    },
  })
  uploadedBy: {
    nickname: string;
    profileImage: string;
  };

  @Prop({
    type: [
      {
        text: { type: String, required: true },
        nickname: { type: String, required: true },
        profileImage: { type: String, required: true },
        // createdAt 제거됨
      },
    ],
    default: [],
  })
  comments: {
    text: string;
    nickname: string;
    profileImage: string;
  }[];
  // ✅ 찜한 사용자 닉네임들
  @Prop({ type: [String], default: [] })
  savedBy: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

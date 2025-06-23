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
      _id: { type: String, required: true },
      nickname: String,
      profileImage: String,
    },
    required: true,
  })
  uploadedBy: {
    _id: string;
    nickname: string;
    profileImage: string;
  };

  @Prop({
    type: [
      {
        userId: { type: String, required: true },
        text: { type: String, required: true },
        nickname: { type: String, required: true },
        profileImage: { type: String, required: true },
      },
    ],
    default: [],
  })
  comments: {
    userId: string;
    text: string;
    nickname: string;
    profileImage: string;
  }[];

  @Prop({ type: [String], default: [] })
  savedBy: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

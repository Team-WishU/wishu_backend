import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
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
  productUrl: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({
    type: {
      nickname: { type: String, required: true },
      profileImage: { type: String, required: true },
    },
  })
  uploadedBy: {
    nickname: string;
    profileImage: string;
  };

  //   @Prop({
  //     type: {
  //       nickname: { type: String },
  //       profileImage: { type: String },
  //     },
  //   })

  @Prop()
  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './products.schema';
import { CreateProductDto } from './create-product.dto';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    imageUrl: string,
    user: { nickname: string; profileImage: string },
  ) {
    const product = new this.productModel({
      ...createProductDto,
      imageUrl,
      uploadedBy: user,
    });

    const saved = await product.save();

    return {
      success: true,
      message: '상품이 성공적으로 등록되었습니다.',
      data: {
        id: saved._id,
        ...createProductDto,
        imageUrl: saved.imageUrl,
        productUrl: saved.productUrl,
        uploadedBy: saved.uploadedBy,
        createdAt: saved.createdAt,
      },
    };
  }
}

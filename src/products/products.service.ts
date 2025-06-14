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
    createProductDto: CreateProductDto & { imageUrl: string },
    user: { nickname: string; profileImage: string },
  ) {
    const product = new this.productModel({
      ...createProductDto,
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
      },
    };
  }

  async findById(productId: string): Promise<ProductDocument | null> {
    return this.productModel.findById(productId);
  }

  async addComment(
    productId: string,
    text: string,
    user: { nickname: string; profileImage: string },
  ): Promise<ProductDocument | null> {
    const comment = {
      text,
      nickname: user.nickname,
      profileImage: user.profileImage,
    };

    return this.productModel.findByIdAndUpdate(
      productId,
      { $push: { comments: comment } },
      { new: true },
    );
  }

  async searchProducts(filters: {
    keyword?: string;
    tag?: string;
    brand?: string;
  }) {
    const query: any = {};

    if (filters.keyword) {
      query.title = { $regex: filters.keyword, $options: 'i' };
    }

    if (filters.tag) {
      query.tags = filters.tag;
    }

    if (filters.brand) {
      query.brand = filters.brand;
    }

    const products = await this.productModel.find(query).exec();
    return { success: true, data: products };
  }
}

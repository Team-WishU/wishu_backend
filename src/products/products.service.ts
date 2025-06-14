import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './products.schema';
import { CreateProductDto } from './create-product.dto';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // 상품 생성
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

  // 상품 ID로 상세 조회
  async findById(productId: string): Promise<ProductDocument | null> {
    return this.productModel.findById(productId);
  }

  // 댓글 추가
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

  // 🔍 자동완성 검색 (상품명, 브랜드, 태그 기준)
  async getAutoCompleteKeywords(input: string): Promise<string[]> {
    const regex = new RegExp(`^${input}`, 'i');

    const products = await this.productModel.find({
      $or: [{ title: regex }, { brand: regex }, { tags: regex }],
    });

    const titles = products.map((p) => p.title);
    const brands = products.map((p) => p.brand);
    const tags = products.flatMap((p) => p.tags || []);

    const all = [...titles, ...brands, ...tags];
    const filtered = all.filter((value) =>
      value?.toLowerCase().startsWith(input.toLowerCase()),
    );

    const unique = [...new Set(filtered)];
    return unique.slice(0, 10); // 최대 10개 반환
  }

  // 검색
  async searchProducts(filters: {
    keyword?: string;
    tag?: string;
    brand?: string;
  }) {
    const query: any = {};

    if (filters.keyword) {
      query.$or = [
        { title: { $regex: filters.keyword, $options: 'i' } },
        { brand: { $regex: filters.keyword, $options: 'i' } },
        { category: { $regex: filters.keyword, $options: 'i' } },
        { tags: { $in: [filters.keyword] } },
      ];
    }

    if (filters.tag) {
      query.tags = { $in: [filters.tag] };
    }

    if (filters.brand) {
      query.brand = { $regex: filters.brand, $options: 'i' };
    }

    const products = await this.productModel.find(query).exec();
    return { success: true, data: products };
  }

  // 전체 조회
  async findAll(category?: string): Promise<Product[]> {
    const query = category ? { category } : {};
    return this.productModel.find(query).sort({ createdAt: -1 }).exec();
  }

  // 내 상품 조회
  async findMyProducts(nickname: string): Promise<Product[]> {
    return this.productModel
      .find({ 'uploadedBy.nickname': nickname })
      .sort({ createdAt: -1 })
      .exec();
  }

  // 상품 삭제 (개별)
  async deleteProductById(
    productId: string,
    nickname: string,
  ): Promise<{ message: string }> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    if (product.uploadedBy.nickname !== nickname) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    await this.productModel.deleteOne({ _id: productId });
    return { message: '상품이 삭제되었습니다.' };
  }

  // 카테고리별 삭제
  async deleteByCategory(
    category: string,
    nickname: string,
  ): Promise<{ deletedCount: number }> {
    const result = await this.productModel.deleteMany({
      category,
      'uploadedBy.nickname': nickname,
    });

    return { deletedCount: result.deletedCount };
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './products.schema';
import { CreateProductDto } from './create-product.dto';
import { Model, Types } from 'mongoose';

export interface ProductListResponse {
  success: boolean;
  data: Product[];
}

export interface ProductSaveResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    brand: string;
    price: number;
    category: string;
    tags: string[];
    imageUrl: string;
    productUrl: string;
    uploadedBy: {
      _id: string;
      nickname: string;
      profileImage: string;
    };
  };
}

export interface ProductUpdateResponse {
  message: string;
}

export interface ProductDeleteResponse {
  message: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(
    createProductDto: CreateProductDto & { imageUrl: string },
    user: { _id: string; nickname: string; profileImage: string },
  ): Promise<ProductSaveResponse> {
    const product = new this.productModel({
      ...createProductDto,
      uploadedBy: {
        _id: user._id,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    });
    const saved = await product.save();

    return {
      success: true,
      message: '상품이 성공적으로 등록되었습니다.',
      data: {
        id: String(saved._id),
        ...createProductDto,
        imageUrl: saved.imageUrl,
        productUrl: saved.productUrl,
        uploadedBy: saved.uploadedBy,
      },
    };
  }

  async updateProductById(
    productId: string,
    updateData: CreateProductDto & { imageUrl: string },
    userId: string,
  ): Promise<ProductUpdateResponse> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
    if (product.uploadedBy._id !== userId)
      throw new ForbiddenException('수정 권한이 없습니다.');

    await this.productModel.updateOne({ _id: productId }, updateData);

    return { message: '상품이 성공적으로 수정되었습니다.' };
  }

  async findById(productId: string): Promise<ProductDocument | null> {
    return this.productModel.findById(productId);
  }

  async addComment(
    productId: string,
    text: string,
    user: { _id: string; nickname: string; profileImage: string },
  ): Promise<ProductDocument | null> {
    const comment = {
      userId: user._id,
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

  async getAutoCompleteKeywords(input: string): Promise<string[]> {
    const regex = new RegExp(`^${input}`, 'i');
    const products: Product[] = await this.productModel.find({
      $or: [{ title: regex }, { brand: regex }, { tags: regex }],
    });

    const suggestions: { value: string; type: string }[] = [];

    for (const p of products) {
      if (
        typeof p.title === 'string' &&
        p.title.toLowerCase().startsWith(input.toLowerCase())
      ) {
        suggestions.push({ value: p.title, type: '상품명' });
      }
      if (
        typeof p.brand === 'string' &&
        p.brand.toLowerCase().startsWith(input.toLowerCase())
      ) {
        suggestions.push({ value: p.brand, type: '브랜드' });
      }
      for (const tag of p.tags || []) {
        if (
          typeof tag === 'string' &&
          tag.toLowerCase().startsWith(input.toLowerCase())
        ) {
          suggestions.push({ value: tag, type: '태그' });
        }
      }
    }

    const uniqueMap = new Map<string, string>();
    for (const s of suggestions) {
      const key = `${s.type}-${s.value}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, `[${s.type}] ${s.value}`);
      }
    }

    return Array.from(uniqueMap.values()).slice(0, 10);
  }

  async searchProducts(filters: {
    keyword?: string;
    tag?: string;
    brand?: string;
  }): Promise<ProductListResponse> {
    const query: Record<string, unknown> = {};

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

    const products: Product[] = await this.productModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    return { success: true, data: products };
  }

  async findAll(category?: string): Promise<Product[]> {
    const query: Record<string, unknown> = category ? { category } : {};
    return this.productModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findMyProducts(userId: string): Promise<Product[]> {
    const objectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    return this.productModel
      .find({ 'uploadedBy._id': objectId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteProductById(
    productId: string,
    userId: string,
  ): Promise<ProductDeleteResponse> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
    if (product.uploadedBy._id !== userId)
      throw new ForbiddenException('삭제 권한이 없습니다.');

    await this.productModel.deleteOne({ _id: productId });
    return { message: '상품이 삭제되었습니다.' };
  }

  async deleteByCategory(
    category: string,
    userId: string,
  ): Promise<{ deletedCount: number }> {
    const result = await this.productModel.deleteMany({
      category,
      'uploadedBy._id': userId,
    });

    return { deletedCount: result.deletedCount };
  }

  async deleteByOwner(userId: string): Promise<void> {
    await this.productModel.deleteMany({ 'uploadedBy._id': userId });
  }

  async deleteCommentsByUserId(userId: string): Promise<void> {
    await this.productModel.updateMany(
      { 'comments.userId': userId },
      { $pull: { comments: { userId } } },
    );
  }

  async deleteSavedByUser(userId: string): Promise<void> {
    await this.productModel.updateMany({}, { $pull: { savedBy: userId } });
  }

  async saveProductForUser(
    productId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    await this.productModel.updateOne(
      { _id: productId },
      { $addToSet: { savedBy: userId } },
    );

    return { message: '상품이 찜 목록에 추가되었습니다.' };
  }

  async getSavedProducts(
    userId: string,
  ): Promise<{ [category: string]: Product[] }> {
    const savedProducts = await this.productModel
      .find({ savedBy: userId })
      .sort({ createdAt: -1 });

    const grouped: { [category: string]: Product[] } = {};
    for (const product of savedProducts) {
      const category = product.category || '기타';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(product);
    }

    return grouped;
  }

  async deleteSavedByCategory(
    category: string,
    userId: string,
  ): Promise<{ deletedCount: number }> {
    const result = await this.productModel.updateMany(
      { category, savedBy: userId },
      { $pull: { savedBy: userId } },
    );

    return { deletedCount: result.modifiedCount };
  }

  async deleteSavedProduct(
    productId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    await this.productModel.updateOne(
      { _id: productId },
      { $pull: { savedBy: userId } },
    );

    return { message: '찜 목록에서 상품이 삭제되었습니다.' };
  }

  async findByTag(tag: string): Promise<Product[]> {
    return this.productModel.find({ tags: { $in: [tag] } }).lean();
  }

  async findByKeywords(keywords: string[]): Promise<Product[]> {
    if (!keywords || keywords.length === 0) return [];

    const regexConditions = keywords.map((kw) => ({
      $or: [
        { title: { $regex: kw, $options: 'i' } },
        { description: { $regex: kw, $options: 'i' } },
        { tags: { $regex: kw, $options: 'i' } },
      ],
    }));

    return this.productModel.find({ $or: regexConditions }).limit(10).exec();
  }

  async getUserSavedTags(userId: string): Promise<string[]> {
    const products = await this.productModel
      .find({ savedBy: userId })
      .select('tags')
      .lean();

    const tagSet = new Set<string>();
    for (const product of products) {
      for (const tag of product.tags || []) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet);
  }

  async findByTagAndCategory(
    tag: string,
    category: string,
  ): Promise<Product[]> {
    return this.productModel
      .find({
        tags: tag,
        category: category,
      })
      .exec();
  }
}

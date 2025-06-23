import {
  Controller,
  Post,
  UseGuards,
  Body,
  Req,
  Get,
  Param,
  Query,
  Delete,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ProductsService,
  ProductListResponse,
  ProductSaveResponse,
  ProductDeleteResponse,
  ProductUpdateResponse,
} from './products.service';
import { CreateProductDto } from './create-product.dto';
import { Request } from 'express';
import { Product } from './products.schema';

interface UserPayload {
  _id: string;
  nickname: string;
  profileImage: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  async searchProducts(
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('brand') brand?: string,
  ): Promise<ProductListResponse> {
    return this.productsService.searchProducts({ keyword, tag, brand });
  }

  @Get('autocomplete')
  async getAutoComplete(@Query('input') input: string): Promise<string[]> {
    return this.productsService.getAutoCompleteKeywords(input);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto & { imageUrl: string },
    @Req() req: Request,
  ): Promise<ProductSaveResponse> {
    const user = req.user as UserPayload;
    return this.productsService.create(createProductDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: CreateProductDto & { imageUrl: string },
    @Req() req: Request,
  ): Promise<ProductUpdateResponse> {
    const user = req.user as UserPayload;
    return this.productsService.updateProductById(id, updateData, user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyProducts(@Req() req: Request): Promise<Product[]> {
    const user = req.user as UserPayload;
    return this.productsService.findMyProducts(user._id);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<Product | null> {
    return this.productsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @Req() req: Request,
  ): Promise<Product | null> {
    const user = req.user as UserPayload;
    return this.productsService.addComment(id, text, user);
  }

  @Get()
  async getAllProducts(
    @Query('category') category?: string,
  ): Promise<Product[]> {
    return this.productsService.findAll(category);
  }

  @Get('user/:userId')
  async getProductsByUserId(
    @Param('userId') userId: string,
  ): Promise<Product[]> {
    return this.productsService.findMyProducts(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteProduct(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ProductDeleteResponse> {
    const user = req.user as UserPayload;
    return this.productsService.deleteProductById(id, user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('category/:category')
  async deleteByCategory(
    @Param('category') category: string,
    @Req() req: Request,
  ): Promise<{ deletedCount: number }> {
    const user = req.user as UserPayload;
    return this.productsService.deleteByCategory(category, user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async saveProduct(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const user = req.user as UserPayload;
    return this.productsService.saveProductForUser(id, user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved/my')
  async getSavedProducts(
    @Req() req: Request,
  ): Promise<{ [category: string]: Product[] }> {
    const user = req.user as UserPayload;
    return this.productsService.getSavedProducts(user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('saved/category/:category')
  async deleteSavedByCategory(
    @Param('category') category: string,
    @Req() req: Request,
  ): Promise<{ deletedCount: number }> {
    const user = req.user as UserPayload;
    return this.productsService.deleteSavedByCategory(category, user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  async deleteSavedProduct(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const user = req.user as UserPayload;
    return this.productsService.deleteSavedProduct(id, user._id);
  }
}

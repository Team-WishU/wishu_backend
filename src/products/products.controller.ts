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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
import { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  //  검색
  @Get('search')
  async searchProducts(
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('brand') brand?: string,
  ) {
    return this.productsService.searchProducts({ keyword, tag, brand });
  }

  //  자동완성 키워드 검색
  @Get('autocomplete')
  async getAutoComplete(@Query('input') input: string) {
    return this.productsService.getAutoCompleteKeywords(input);
  }

  //  상품 생성
  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto & { imageUrl: string },
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string; profileImage: string };
    return this.productsService.create(createProductDto, user);
  }

  //  내 상품 조회
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyProducts(@Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.findMyProducts(user.nickname);
  }

  //  단일 상품 조회
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  //  댓글 추가
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string; profileImage: string };
    return this.productsService.addComment(id, text, user);
  }

  //  전체 상품 조회 (카테고리 필터 포함)
  @Get()
  async getAllProducts(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }

  //  개별 상품 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteProductById(id, user.nickname);
  }

  //  카테고리별 상품 전체 삭제
  @UseGuards(JwtAuthGuard)
  @Delete('category/:category')
  async deleteByCategory(
    @Param('category') category: string,
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteByCategory(category, user.nickname);
  }

  // 다른 사용자가 올린 상품 찜하기
  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async saveProduct(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.saveProductForUser(id, user.nickname);
  }

  // 내가 찜한 상품 목록 조회
  @UseGuards(JwtAuthGuard)
  @Get('saved/my')
  async getSavedProducts(@Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.getSavedProducts(user.nickname);
  }
  // 찜한 상품 중 특정 카테고리 전체 삭제
  @UseGuards(JwtAuthGuard)
  @Delete('saved/category/:category')
  async deleteSavedByCategory(
    @Param('category') category: string,
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteSavedByCategory(category, user.nickname);
  }
  // 찜한 상품 개별 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  async deleteSavedProduct(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { nickname: string };
    return this.productsService.deleteSavedProduct(id, user.nickname);
  }
}

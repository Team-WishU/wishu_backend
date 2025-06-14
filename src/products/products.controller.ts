import {
  Controller,
  Post,
  UseGuards,
  Body,
  Req,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
import { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ✅ 검색 라우터
  @Get('search')
  async searchProducts(
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('brand') brand?: string,
  ) {
    return this.productsService.searchProducts({ keyword, tag, brand });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto & { imageUrl: string },
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string; profileImage: string };
    return this.productsService.create(createProductDto, user);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

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
}

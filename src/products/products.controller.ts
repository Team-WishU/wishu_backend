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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
// Express의 Request 타입 사용
import { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 상품 생성: POST /products
  // 로그인한 사용자만 접근 가능 (@UseGuards)
  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto & { imageUrl: string },
    @Req() req: Request,
  ) {
    console.log('req.user ', req.user);
    const user = req.user as { nickname: string; profileImage: string };
    return this.productsService.create(createProductDto, user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyProducts(@Req() req: Request) {
    console.log('req.user ::: ', req.user);
    const user = req.user as { nickname: string };
    return this.productsService.findMyProducts(user.nickname);
  }

  // 상품 상세 조회: GET /products/:id
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  // 댓글 추가: POST /products/:id/comments
  // 로그인한 사용자만 댓글 작성 가능
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
  //상품 전체 목록 조회
  @Get()
  async getAllProducts(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }
}

import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
import { Request } from 'express';
import { Express } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createProduct(
    @UploadedFile() file: Express.Multer.File,
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
  ) {
    const user = req.user as { nickname: string; profileImage: string };

    // TODO: 이미지 업로드 처리하여 실제 URL 생성 (임시로 고정 URL 사용)
    const imageUrl = `https://cdn.wishu.com/products/temp-${Date.now()}.jpg`;

    return this.productsService.create(createProductDto, imageUrl, user);
  }
}
